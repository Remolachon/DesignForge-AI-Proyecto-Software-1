from sqlalchemy.orm import Session
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
        supabase_id: str,
    ) -> User:
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            supabase_id=supabase_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user