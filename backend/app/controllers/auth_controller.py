import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from supabase_auth.errors import AuthApiError

from app.database.database import get_db
from app.providers.google_provider import GoogleOAuthProvider
from app.providers.supabase_provider import supabase
from app.schemas.user_schema import AuthResponse, GoogleOAuthRequest, LoginRequest, RegisterRequest
from app.services.user_service import UserService


router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


def _service_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="La base de datos no está disponible. Intenta nuevamente en unos minutos.",
    )


def _update_user_profile(
    db: Session,
    db_user,
    first_name: str | None = None,
    last_name: str | None = None,
    phone: str | None = None,
) -> None:
    should_commit = False

    if first_name and first_name != db_user.first_name:
        db_user.first_name = first_name
        should_commit = True

    if last_name and last_name != db_user.last_name:
        db_user.last_name = last_name
        should_commit = True

    if phone is not None:
        normalized_phone = phone.strip() or None
        if normalized_phone != db_user.phone:
            db_user.phone = normalized_phone
            should_commit = True

    if should_commit:
        db.commit()
        db.refresh(db_user)


def _link_google_account(
    db: Session,
    db_user,
    supabase_id: str,
    first_name: str | None = None,
    last_name: str | None = None,
    phone: str | None = None,
) -> None:
    should_commit = False

    if db_user.supabase_id != supabase_id:
        db_user.supabase_id = supabase_id
        should_commit = True

    if first_name and first_name != db_user.first_name:
        db_user.first_name = first_name
        should_commit = True

    if last_name and last_name != db_user.last_name:
        db_user.last_name = last_name
        should_commit = True

    if phone is not None:
        normalized_phone = phone.strip() or None
        if normalized_phone != db_user.phone:
            db_user.phone = normalized_phone
            should_commit = True

    if should_commit:
        db.commit()
        db.refresh(db_user)


def _build_auth_response(db: Session, db_user, access_token: str) -> AuthResponse:
    return AuthResponse(
        access_token=access_token,
        first_name=db_user.first_name,
        last_name=db_user.last_name,
        role=UserService.get_user_role_name(db, db_user.id),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if not payload.first_name.strip() or not payload.last_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hay campos vacíos",
        )

    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener mínimo 6 caracteres",
        )

    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas no coinciden",
        )

    if payload.phone is not None and payload.phone.strip() and not payload.phone.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El teléfono debe contener solo números",
        )

    try:
        response = supabase.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )

        if response.user is None or response.session is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo completar el registro",
            )

        db_user = UserService.get_user_by_supabase_id(db, response.user.id)

        if db_user is None:
            db_user = UserService.create_user(
                db,
                email=response.user.email or payload.email,
                first_name=payload.first_name,
                last_name=payload.last_name,
                phone=payload.phone,
                supabase_id=response.user.id,
            )
            UserService.assign_default_role(db, db_user.id)
        else:
            _update_user_profile(
                db,
                db_user,
                first_name=payload.first_name,
                last_name=payload.last_name,
                phone=payload.phone,
            )

        return _build_auth_response(db, db_user, response.session.access_token)
    except AuthApiError as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este correo ya está registrado",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo completar el registro",
        )
    except OperationalError:
        raise _service_unavailable()


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    if not payload.email.strip() or not payload.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hay campos vacíos",
        )

    try:
        response = supabase.auth.sign_in_with_password(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )

        if response.session is None or response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
            )

        supabase_user = response.user
        metadata = supabase_user.user_metadata or {}
        db_user = UserService.get_user_by_supabase_id(db, supabase_user.id)

        if db_user is None:
            db_user = UserService.create_user(
                db,
                email=supabase_user.email or payload.email,
                first_name=metadata.get("first_name", ""),
                last_name=metadata.get("last_name", ""),
                phone=metadata.get("phone"),
                supabase_id=supabase_user.id,
            )
            UserService.assign_default_role(db, db_user.id)
        else:
            _update_user_profile(
                db,
                db_user,
                first_name=metadata.get("first_name"),
                last_name=metadata.get("last_name"),
                phone=metadata.get("phone"),
            )

        return _build_auth_response(db, db_user, response.session.access_token)
    except AuthApiError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    except OperationalError:
        raise _service_unavailable()


@router.post("/google-oauth", response_model=AuthResponse)
def google_oauth(payload: GoogleOAuthRequest, db: Session = Depends(get_db)):
    try:
        logger.debug("/google-oauth called", extra={"access_token_present": bool(payload.access_token)})
        token_payload = GoogleOAuthProvider.verify_supabase_token(payload.access_token)

        if not token_payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de Google inválido o expirado",
            )

        user_info = GoogleOAuthProvider.extract_user_info(token_payload)
        supabase_id = user_info.get("supabase_id")
        email = user_info.get("email")
        first_name = user_info.get("first_name", "")
        last_name = user_info.get("last_name", "")
        phone = user_info.get("phone")

        if not supabase_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se pudo validar la cuenta de Google",
            )

        logger.debug(
            "google oauth processed",
            extra={
                "supabase_id": supabase_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        db_user = UserService.get_user_by_supabase_id(db, supabase_id)

        if db_user is None:
            db_user = UserService.get_user_by_email(db, email)

        if db_user is None:
            db_user = UserService.create_user(
                db,
                email=email,
                first_name=first_name or "",
                last_name=last_name or "",
                phone=phone,
                supabase_id=supabase_id,
            )
            UserService.assign_default_role(db, db_user.id)
        else:
            if db_user.supabase_id != supabase_id:
                _link_google_account(
                    db,
                    db_user,
                    supabase_id=supabase_id,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                )
            else:
                _update_user_profile(
                    db,
                    db_user,
                    first_name=first_name,
                    last_name=last_name,
                    phone=phone,
                )
        return _build_auth_response(db, db_user, payload.access_token)
    except OperationalError:
        raise _service_unavailable()
    except HTTPException:
        # Re-raise HTTPExceptions so FastAPI handles them normally
        raise
    except Exception as e:
        logger.exception("unexpected error in /google-oauth")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al procesar la autenticación con Google",
        )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> None:
    try:
        supabase.auth.sign_out()
    except OperationalError:
        raise _service_unavailable()