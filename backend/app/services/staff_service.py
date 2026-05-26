import logging

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.models.notification import Notification
from app.models.company import Company

logger = logging.getLogger(__name__)

# ID fijo del rol 'funcionario' (id=2) y 'funcionario_adm' (id=4)
ROLE_FUNCIONARIO_NAME = "funcionario"
ROLE_FUNCIONARIO_ADM_NAME = "funcionario_adm"


def get_company_staff(db: Session, company_id: int, current_user_id: int) -> list[dict]:
    """
    Retorna todos los usuarios de la empresa que tienen rol 'funcionario',
    excluyendo al usuario actual (administrador).
    (activos e inactivos en user_roles).
    """
    rows = (
        db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.email,
            User.is_active,
            UserRole.is_active.label("role_active"),
            UserRole.assigned_at,
        )
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .filter(
            User.company_id == company_id,
            Role.name == ROLE_FUNCIONARIO_NAME,
            User.id != current_user_id,
        )
        .all()
    )

    return [
        {
            "id": row.id,
            "first_name": row.first_name,
            "last_name": row.last_name,
            "email": row.email,
            "is_active": bool(row.is_active),
            "role_active": bool(row.role_active),
            "assigned_at": row.assigned_at.isoformat() if row.assigned_at else None,
        }
        for row in rows
    ]


def _get_funcionario_role(db: Session) -> Role:
    """Obtiene el objeto Role para 'funcionario', lanza 500 si no existe."""
    role = db.query(Role).filter(Role.name == ROLE_FUNCIONARIO_NAME).first()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"El rol '{ROLE_FUNCIONARIO_NAME}' no existe en la base de datos.",
        )
    return role


def _get_user_in_company(db: Session, target_user_id: int, company_id: int) -> User:
    """Valida que el usuario exista y pertenezca a la empresa. Lanza 404/403 si no."""
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    if target_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no pertenece a tu empresa",
        )
    return target_user


def assign_funcionario_role(db: Session, target_user_id: int, company_id: int) -> dict:
    """
    Asigna el rol 'funcionario' al usuario indicado dentro de la empresa.
    Si ya tiene una fila en user_roles para ese rol, la reactiva.
    """
    _get_user_in_company(db, target_user_id, company_id)
    role = _get_funcionario_role(db)

    existing = (
        db.query(UserRole)
        .filter(
            UserRole.user_id == target_user_id,
            UserRole.role_id == role.id,
        )
        .first()
    )

    try:
        if existing is None:
            new_ur = UserRole(
                user_id=target_user_id,
                role_id=role.id,
                is_active=True,
            )
            db.add(new_ur)
        else:
            existing.is_active = True

        db.commit()
        logger.info(
            "Rol 'funcionario' asignado — user_id=%s, company_id=%s",
            target_user_id,
            company_id,
        )
        company = db.query(Company).filter(Company.id == company_id).first()
        company_name = company.name if company else "la empresa"

        # Enviar notificación
        notification = Notification(
            user_id=target_user_id,
            title="Permisos Restaurados",
            message=f"Se han restaurado tus permisos de funcionario en {company_name}.",
            type="staff_access",
            is_read=False,
            link_url="/funcionario/dashboard",
        )
        db.add(notification)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo asignar el rol al usuario",
        )

    return {"message": "Rol 'funcionario' asignado correctamente", "user_id": target_user_id}


def revoke_funcionario_role(db: Session, target_user_id: int, company_id: int) -> dict:
    """
    Revoca (desactiva) el rol 'funcionario' del usuario indicado dentro de la empresa.
    """
    _get_user_in_company(db, target_user_id, company_id)
    role = _get_funcionario_role(db)

    user_role = (
        db.query(UserRole)
        .filter(
            UserRole.user_id == target_user_id,
            UserRole.role_id == role.id,
        )
        .first()
    )

    if user_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no tiene el rol 'funcionario'",
        )

    user_role.is_active = False
    db.commit()
    logger.info(
        "Rol 'funcionario' revocado — user_id=%s, company_id=%s",
        target_user_id,
        company_id,
    )

    company = db.query(Company).filter(Company.id == company_id).first()
    company_name = company.name if company else "la empresa"

    # Enviar notificación
    notification = Notification(
        user_id=target_user_id,
        title="Permisos Revocados",
        message=f"Tus permisos de funcionario han sido desactivados en {company_name}.",
        type="staff_access",
        is_read=False,
    )
    db.add(notification)
    db.commit()

    return {"message": "Rol 'funcionario' revocado correctamente", "user_id": target_user_id}


def invite_funcionario(db: Session, email: str, company_id: int) -> dict:
    """
    Invita a un usuario registrado a la empresa.
    Si no está registrado, o ya pertenece a otra empresa, lanza un error.
    """
    target_user = db.query(User).filter(User.email == email).first()
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un usuario con ese correo electrónico. Asegúrate de que ya esté registrado en LukArt."
        )

    if target_user.company_id is not None:
        if target_user.company_id == company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya pertenece a esta empresa."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario ya pertenece a otra empresa."
            )

    # Validar que no tenga rol de administrador (solo para estar seguros)
    from app.services.user_service import UserService
    current_role = UserService.get_user_role_name(db, target_user.id)
    if current_role == "administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se puede invitar a un administrador global."
        )

    # Asignar la empresa y el rol
    UserService.promote_user_to_funcionario(
        db, target_user.id, company_id, commit=True)
    logger.info(
        "Usuario %s (ID: %s) invitado como funcionario a la empresa %s",
        email,
        target_user.id,
        company_id,
    )

    company = db.query(Company).filter(Company.id == company_id).first()
    company_name = company.name if company else "una empresa"

    # Enviar notificación
    notification = Notification(
        user_id=target_user.id,
        title="¡Has sido invitado!",
        message=f"Te han asignado como funcionario a la empresa {company_name}.",
        type="staff_invite",
        is_read=False,
        link_url="/funcionario/dashboard",
    )
    db.add(notification)
    db.commit()

    return {"message": "Usuario invitado correctamente", "user_id": target_user.id}


def remove_funcionario_from_company(db: Session, target_user_id: int, company_id: int) -> dict:
    """
    Elimina completamente a un funcionario de la empresa.
    Establece su company_id a NULL y su rol activo pasa a ser 'cliente'.
    """
    target_user = _get_user_in_company(db, target_user_id, company_id)

    from app.services.user_service import UserService

    # Desvincular de la empresa
    UserService.set_user_company(db, target_user_id, None, commit=False)

    # Restablecer su rol a cliente (esto desactiva 'funcionario' o 'funcionario_adm' que tuviera activos)
    UserService.set_user_role(db, target_user_id, "cliente", commit=False)

    company = db.query(Company).filter(Company.id == company_id).first()
    company_name = company.name if company else "la empresa"

    db.commit()
    logger.info(
        "Usuario %s (ID: %s) removido de la empresa %s",
        target_user.email,
        target_user_id,
        company_id,
    )

    # Enviar notificación de eliminación
    notification = Notification(
        user_id=target_user_id,
        title="Removido de la empresa",
        message=f"Has sido removido del equipo de trabajo de {company_name}.",
        type="staff_remove",
        is_read=False,
    )
    db.add(notification)
    db.commit()

    return {"message": "Usuario removido de la empresa correctamente", "user_id": target_user_id}

