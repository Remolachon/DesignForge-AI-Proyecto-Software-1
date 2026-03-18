from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.security.token_validator import get_current_user
from app.services.user_service import UserService
from app.schemas.user_schema import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = UserService.get_user_by_supabase_id(db, current_user.id)

    if not user:
        user = UserService.create_user(
            db,
            email=current_user.email,
            supabase_id=current_user.id
        )

    return user