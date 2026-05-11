from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.notification import Notification
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.productionStage import ProductionStage
from app.models.product import Product
from app.models.review import Review
from app.models.user import User


class InteractionService:
    @staticmethod
    def _now_local() -> datetime:
        return datetime.utcnow() - timedelta(hours=5)

    @staticmethod
    def _canonical_status(value: str | None) -> str:
        if not value:
            return ""
        normalized = value.strip().lower()
        if normalized in {"entregado", "delivered"}:
            return "Entregado"
        return value.strip()

    @staticmethod
    def _serialize_review(review: Review) -> dict:
        user = review.user
        user_name = "Cliente"
        if user:
            user_name = f"{user.first_name} {user.last_name}".strip() or user.email or "Cliente"

        created_at = review.created_at or InteractionService._now_local()

        return {
            "id": review.id,
            "productId": review.product_id,
            "userId": review.user_id,
            "rating": int(review.rating or 0),
            "comment": review.comment,
            "createdAt": created_at.isoformat(),
            "userName": user_name,
        }

    @staticmethod
    def _serialize_notification(notification: Notification) -> dict:
        created_at = notification.created_at or InteractionService._now_local()
        return {
            "id": notification.id,
            "userId": notification.user_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "linkUrl": notification.link_url,
            "isRead": bool(notification.is_read),
            "createdAt": created_at.isoformat(),
        }

    @staticmethod
    def create_review(db: Session, user_id: int, product_id: int, rating: int, comment: str | None = None) -> dict:
        if rating < 0 or rating > 5:
            raise ValueError("La valoración debe estar entre 0 y 5")

        product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
        if not product:
            raise ValueError("Producto no encontrado")

        delivered_stage = (
            db.query(ProductionStage)
            .filter(func.lower(ProductionStage.name) == "entregado")
            .first()
        )
        if not delivered_stage:
            raise ValueError("Solo puedes valorar productos de pedidos entregados")

        has_delivered_order = (
            db.query(Order.id)
            .join(Order.items)
            .filter(Order.user_id == user_id)
            .filter(OrderItem.product_id == product_id)
            .filter(OrderItem.current_stage_id == delivered_stage.id)
            .first()
        )

        if not has_delivered_order:
            raise ValueError("Solo puedes valorar productos de pedidos entregados")

        # Crear una nueva review siempre que el pedido del producto ya esté entregado
        review = Review(
            product_id=product_id,
            user_id=user_id,
            rating=rating,
            comment=comment.strip() if isinstance(comment, str) and comment.strip() else None,
            created_at=InteractionService._now_local(),
        )
        db.add(review)

        db.flush()
        db.refresh(review)
        return InteractionService._serialize_review(review)

    @staticmethod
    def list_product_reviews(db: Session, product_id: int) -> dict:
        reviews = (
            db.query(Review)
            .options(joinedload(Review.user))
            .filter(Review.product_id == product_id)
            .order_by(Review.created_at.desc(), Review.id.desc())
            .all()
        )

        return {
            "items": [InteractionService._serialize_review(review) for review in reviews],
            "totalItems": len(reviews),
        }

    @staticmethod
    def list_user_notifications(db: Session, user_id: int) -> dict:
        notifications = (
            db.query(Notification)
            .filter(Notification.user_id == user_id)
            .filter(Notification.is_read == False)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(10)
            .all()
        )
        unread_count = (
            db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .count()
        )

        return {
            "items": [InteractionService._serialize_notification(notification) for notification in notifications],
            "unreadCount": unread_count,
        }

    @staticmethod
    def mark_notification_as_read(db: Session, user_id: int, notification_id: int) -> dict:
        notification = (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.user_id == user_id)
            .first()
        )

        if not notification:
            raise ValueError("Notificación no encontrada")

        notification.is_read = True
        db.flush()
        db.refresh(notification)
        return InteractionService._serialize_notification(notification)

    @staticmethod
    def create_delivery_review_notification(
        db: Session,
        user_id: int,
        order_id: int,
        product_id: int,
        product_name: str | None = None,
    ) -> dict | None:
        title_name = product_name or "tu producto"
        title = "Tu pedido fue entregado"
        message = (
            f"Tu pedido #{order_id} para {title_name} ya fue entregado. "
            "Ya puedes dejar una valoración y un comentario para ayudar a otros clientes."
        )

        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type="order-delivered-review",
            is_read=False,
            created_at=InteractionService._now_local(),
        )
        db.add(notification)
        db.flush()
        notification.link_url = f"/marketplace/{product_id}?review=1&notification={notification.id}"
        db.flush()
        db.refresh(notification)
        return InteractionService._serialize_notification(notification)