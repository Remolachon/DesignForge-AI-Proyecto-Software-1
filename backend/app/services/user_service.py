from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole


class UserService:

    @staticmethod
    def get_user_by_supabase_id(db: Session, supabase_id: str) -> User | None:
        return db.query(User).filter(User.supabase_id == supabase_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create_user(
        db: Session,
        email: str,
        first_name: str,
        last_name: str,
        phone: str | None,
        supabase_id: str,
    ) -> User:

        if phone is not None and phone.strip() == "":
            phone = None

        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            supabase_id=supabase_id,
        )

        try:
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya existe",
            )

    # 🔥 ASIGNAR ROL CLIENTE
    @staticmethod
    def assign_default_role(db: Session, user_id: int) -> None:
        UserService.set_user_role(db, user_id, "cliente")

    @staticmethod
    def get_role_by_name(db: Session, role_name: str) -> Role | None:
        return db.query(Role).filter(Role.name == role_name).first()

    @staticmethod
    def set_user_role(db: Session, user_id: int, role_name: str, commit: bool = True) -> None:
        role = UserService.get_role_by_name(db, role_name)

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"El rol '{role_name}' no existe en la base de datos.",
            )

        active_roles = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.is_active == True,
        ).all()

        existing = None
        for user_role in active_roles:
            if user_role.role_id == role.id:
                existing = user_role
            user_role.is_active = False

        if existing is None:
            existing = db.query(UserRole).filter(
                UserRole.user_id == user_id,
                UserRole.role_id == role.id,
            ).first()

        if existing is None:
            existing = UserRole(
                user_id=user_id,
                role_id=role.id,
                is_active=True,
            )
            db.add(existing)
        else:
            existing.is_active = True

        if commit:
            db.commit()

    @staticmethod
    def set_user_company(db: Session, user_id: int, company_id: int | None, commit: bool = True) -> None:
        user = db.query(User).filter(User.id == user_id).first()

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        if user.company_id == company_id:
            return

        user.company_id = company_id
        if commit:
            db.commit()

    @staticmethod
    def promote_user_to_funcionario(db: Session, user_id: int, company_id: int, commit: bool = True) -> None:
        UserService.set_user_company(db, user_id, company_id, commit=False)
        UserService.set_user_role(db, user_id, "funcionario", commit=False)

        if commit:
            db.commit()

    # 🔥 OBTENER ROL DEL USUARIO
    @staticmethod
    def get_user_role_name(db: Session, user_id: int) -> str:
        user_role = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.is_active == True
        ).first()

        if user_role is None:
            return "cliente"

        role = db.query(Role).filter(Role.id == user_role.role_id).first()

        if role is None:
            return "cliente"

        return role.name