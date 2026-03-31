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
        role = db.query(Role).filter(Role.name == "cliente").first()

        if role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="El rol 'cliente' no existe en la base de datos.",
            )

        existing = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.role_id == role.id
        ).first()

        if existing:
            return

        user_role = UserRole(
            user_id=user_id,
            role_id=role.id,
            is_active=True
        )

        db.add(user_role)
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