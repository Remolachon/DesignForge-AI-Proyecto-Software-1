import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.database.database import get_db
from app.database.connection_retry import retry_on_connection_error
from app.schemas.user_schema import UserResponse
from app.security.token_validator import get_current_user
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Devuelve el perfil del usuario autenticado.
    Si no existe en la BD local (ej. creado directo en Supabase), lo crea.
    """
    try:
        def _get_user():
            user = UserService.get_user_by_supabase_id(db, current_user.id)
            return user
        
        user = retry_on_connection_error(
            _get_user,
            max_retries=3,
            initial_delay=0.5,
            backoff_factor=2.0
        )

        if user is None:
            metadata = current_user.user_metadata or {}
            user = UserService.create_user(
                db,
                email=current_user.email,
                first_name=metadata.get("first_name", ""),
                last_name=metadata.get("last_name", ""),
                supabase_id=current_user.id,
            )

        return user
    except OperationalError as e:
        logger.error(f"Error de BD al obtener perfil de usuario: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )