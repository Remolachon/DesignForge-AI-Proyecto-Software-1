from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.providers.supabase_provider import supabase
from app.schemas.user_schema import AuthResponse, LoginRequest, RegisterRequest
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Crea un usuario en Supabase Auth y luego lo registra en la base de datos local.
    """
    # 1. Crear usuario en Supabase Auth
    try:
        response = supabase.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al registrar en Supabase: {exc}",
        )

    # sign_up devuelve None en user si el email ya existe sin confirmar
    if response.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado o no es válido.",
        )

    supabase_user = response.user

    # 2. Guardar en la base de datos local (idempotente)
    db_user = UserService.get_user_by_supabase_id(db, supabase_user.id)
    if db_user is None:
        UserService.create_user(
            db,
            email=supabase_user.email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            supabase_id=supabase_user.id,
        )

    # 3. Si Supabase requiere confirmación de email, session puede ser None
    if response.session is None:
        # El usuario fue creado pero aún no confirmó el correo.
        # Devolvemos un token vacío o un mensaje orientativo.
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Registro exitoso. Revisa tu correo para confirmar la cuenta.",
        )

    return AuthResponse(access_token=response.session.access_token)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Autentica al usuario contra Supabase y, si no existe en la BD local,
    lo crea automáticamente (útil para usuarios migrados directamente en Supabase).
    """
    # 1. Autenticar en Supabase
    try:
        response = supabase.auth.sign_in_with_password(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    if response.session is None or response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    supabase_user = response.user

    # 2. Sincronizar con la base de datos local
    db_user = UserService.get_user_by_supabase_id(db, supabase_user.id)
    if db_user is None:
        # Extraer nombre del campo user_metadata si existe
        metadata = supabase_user.user_metadata or {}
        UserService.create_user(
            db,
            email=supabase_user.email,
            first_name=metadata.get("first_name", ""),
            last_name=metadata.get("last_name", ""),
            supabase_id=supabase_user.id,
        )

    return AuthResponse(access_token=response.session.access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    """
    Cierra la sesión en Supabase (invalida el token del lado del servidor).
    El cliente debe eliminar el token almacenado localmente.
    """
    try:
        supabase.auth.sign_out()
    except Exception:
        pass  # Si ya expiró, no importa