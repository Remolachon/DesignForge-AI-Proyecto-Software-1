import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.database.database import get_db
from app.database.connection_retry import retry_on_connection_error
from app.models.user import User
from app.security.token_validator import get_current_user
from app.services.user_service import UserService
from app.services import staff_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/staff", tags=["Funcionario ADM - Staff"])

ROLE_REQUIRED = "funcionario_adm"


# ─── Auth helper ──────────────────────────────────────────────────────────────

def _require_funcionario_adm(db: Session, current_user) -> tuple[User, int]:
    """
    Verifica que el usuario autenticado tenga rol 'funcionario_adm'
    y esté asociado a una empresa.
    Retorna (db_user, company_id).
    """
    def _query():
        db_user = db.query(User).filter(
            User.supabase_id == current_user.id).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no existe en DB",
            )

        role_name = UserService.get_user_role_name(db, db_user.id)
        if role_name != ROLE_REQUIRED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado — se requiere rol 'funcionario_adm'",
            )

        if not db_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario no está asociado a ninguna empresa",
            )

        return db_user, db_user.company_id

    try:
        return retry_on_connection_error(_query, max_retries=3)
    except OperationalError as e:
        logger.error("Error de BD en staff_controller: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos temporalmente no disponible",
        )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/")
def list_staff(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lista todos los usuarios con rol 'funcionario' de la empresa (activos e inactivos)."""
    db_user, company_id = _require_funcionario_adm(db, current_user)

    try:
        return staff_service.get_company_staff(db, company_id, current_user_id=db_user.id)
    except OperationalError as e:
        logger.error("Error de BD en GET /staff/: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@router.post("/{user_id}/assign", status_code=status.HTTP_200_OK)
def assign_staff(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Activa el rol 'funcionario' para el usuario indicado dentro de la empresa."""
    _, company_id = _require_funcionario_adm(db, current_user)

    try:
        return staff_service.assign_funcionario_role(db, user_id, company_id)
    except HTTPException:
        raise
    except OperationalError as e:
        logger.error("Error de BD en POST /staff/%s/assign: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@router.delete("/{user_id}/revoke", status_code=status.HTTP_200_OK)
def revoke_staff(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Revoca (desactiva) el rol 'funcionario' del usuario indicado en la empresa."""
    _, company_id = _require_funcionario_adm(db, current_user)

    try:
        return staff_service.revoke_funcionario_role(db, user_id, company_id)
    except HTTPException:
        raise
    except OperationalError as e:
        logger.error("Error de BD en DELETE /staff/%s/revoke: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@router.post("/invite", status_code=status.HTTP_200_OK)
def invite_staff(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Invita a un usuario registrado a la empresa por su correo."""
    _, company_id = _require_funcionario_adm(db, current_user)
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico es obligatorio.",
        )

    try:
        return staff_service.invite_funcionario(db, email, company_id)
    except HTTPException:
        raise
    except OperationalError as e:
        logger.error("Error de BD en POST /staff/invite: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@router.delete("/{user_id}/remove", status_code=status.HTTP_200_OK)
def remove_staff(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Elimina completamente al funcionario de la empresa y restablece su rol a cliente."""
    _, company_id = _require_funcionario_adm(db, current_user)

    try:
        return staff_service.remove_funcionario_from_company(db, user_id, company_id)
    except HTTPException:
        raise
    except OperationalError as e:
        logger.error("Error de BD en DELETE /staff/%s/remove: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servicio de base de datos temporalmente no disponible",
        )

