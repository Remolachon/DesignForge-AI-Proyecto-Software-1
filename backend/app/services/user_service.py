from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from app.models.user import User


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

        # 🔥 Si phone viene vacío, lo guardamos como None
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
                detail="El correo ya está registrado.",
            )