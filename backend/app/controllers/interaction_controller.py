from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.interaction_schema import (
    NotificationResponse,
    NotificationsResponse,
    ProductReviewsResponse,
    ReviewCreateRequest,
    ReviewResponse,
)
from app.security.token_validator import get_current_user
from app.services.interaction_service import InteractionService

router = APIRouter(tags=["Interactions"])


def _get_db_user(db: Session, current_user):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no existe en DB")
    return db_user


@router.get("/products/{product_id}/reviews", response_model=ProductReviewsResponse)
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
):
    return InteractionService.list_product_reviews(db=db, product_id=product_id)


@router.post("/reviews", response_model=ReviewResponse)
def create_review(
    payload: ReviewCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_db_user(db, current_user)

    try:
        result = InteractionService.create_review(
            db=db,
            user_id=db_user.id,
            product_id=payload.product_id,
            rating=payload.rating,
            comment=payload.comment,
        )
        db.commit()
        return result
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/notifications", response_model=NotificationsResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_db_user(db, current_user)
    return InteractionService.list_user_notifications(db=db, user_id=db_user.id)


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_db_user(db, current_user)

    try:
        notification = InteractionService.mark_notification_as_read(
            db=db,
            user_id=db_user.id,
            notification_id=notification_id,
        )
        db.commit()
        return notification
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))