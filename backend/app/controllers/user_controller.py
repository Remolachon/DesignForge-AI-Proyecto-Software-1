from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user_schema import UserResponse
from app.security.token_validator import get_current_user
from app.services.user_service import UserService

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
    user = UserService.get_user_by_supabase_id(db, current_user.id)

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