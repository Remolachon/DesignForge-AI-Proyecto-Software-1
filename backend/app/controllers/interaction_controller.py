import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.database.database import get_db
from app.database.connection_retry import retry_on_connection_error
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

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Interactions"])


def _get_db_user(db: Session, current_user):
    """
    Obtiene el usuario de la BD con reintentos automáticos.
    """
    def _query_user():
        db_user = db.query(User).filter(User.supabase_id == current_user.id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no existe en DB")
        return db_user
    
    try:
        return retry_on_connection_error(
            _query_user,
            max_retries=3,
            initial_delay=0.5,
            backoff_factor=2.0
        )
    except OperationalError as e:
        logger.error(f"Error crítico de conexión a BD al obtener usuario: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.get("/products/{product_id}/reviews", response_model=ProductReviewsResponse)
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
):
    try:
        return InteractionService.list_product_reviews(db=db, product_id=product_id)
    except OperationalError as e:
        logger.error(f"Error de BD al obtener reviews: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


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
    except OperationalError as e:
        db.rollback()
        logger.error(f"Error de BD al crear review: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.get("/notifications", response_model=NotificationsResponse)
def get_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Obtiene notificaciones del usuario actual con reintentos automáticos.
    """
    db_user = _get_db_user(db, current_user)
    
    try:
        return InteractionService.list_user_notifications(db=db, user_id=db_user.id)
    except OperationalError as e:
        logger.error(f"Error de BD al obtener notificaciones: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


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
    except OperationalError as e:
        db.rollback()
        logger.error(f"Error de BD al marcar notificación como leída: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )