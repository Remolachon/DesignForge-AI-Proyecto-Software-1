from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.providers.supabase_provider import supabase
from app.schemas.user_schema import AuthResponse, LoginRequest, RegisterRequest
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):

    if not payload.first_name.strip() or not payload.last_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre y apellido son obligatorios.",
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres.",
        )

    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden.",
        )

    # 🔥 Validación phone opcional
    if payload.phone is not None and payload.phone.strip() != "":
        if not payload.phone.isdigit():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El teléfono debe contener solo números.",
            )

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

    if response.user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado o no es válido.",
        )

    supabase_user = response.user

    db_user = UserService.get_user_by_supabase_id(db, supabase_user.id)
    if db_user is None:
        db_user = UserService.create_user(
            db,
            email=supabase_user.email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            phone=payload.phone,  # 🔥 NUEVO
            supabase_id=supabase_user.id,
        )

    if response.session is None:
        raise HTTPException(
            status_code=status.HTTP_202_ACCEPTED,
            detail="Registro exitoso. Revisa tu correo para confirmar la cuenta.",
        )

    return AuthResponse(
        access_token=response.session.access_token,
        first_name=db_user.first_name,
        last_name=db_user.last_name
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):

    if not payload.email.strip() or not payload.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo y contraseña son obligatorios.",
        )

    try:
        response = supabase.auth.sign_in_with_password(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )
    except Exception:
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

    db_user = UserService.get_user_by_supabase_id(db, supabase_user.id)

    if db_user is None:
        metadata = supabase_user.user_metadata or {}
        db_user = UserService.create_user(
            db,
            email=supabase_user.email,
            first_name=metadata.get("first_name", ""),
            last_name=metadata.get("last_name", ""),
            phone=metadata.get("phone", None),  # 🔥 NUEVO
            supabase_id=supabase_user.id,
        )

    return AuthResponse(
        access_token=response.session.access_token,
        first_name=db_user.first_name,
        last_name=db_user.last_name
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout():
    try:
        supabase.auth.sign_out()
    except Exception:
        pass