from sqlalchemy.orm import Session
from app.models.user import User

class UserService:

    @staticmethod
    def get_user_by_supabase_id(db, supabase_id: str):
        return db.query(User).filter(User.supabase_id == supabase_id).first()

    @staticmethod
    def create_user(db: Session, email: str, first_name: str, last_name: str):
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user