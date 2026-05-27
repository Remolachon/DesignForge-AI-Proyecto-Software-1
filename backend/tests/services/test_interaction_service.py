"""
Tests for interaction_service.py — full coverage of all methods.
"""
import pytest
import app.main  # Inicializar mappers SQLAlchemy
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.services.interaction_service import InteractionService
from app.models.review import Review
from app.models.notification import Notification
from app.models.product import Product
from app.models.productionStage import ProductionStage


@pytest.fixture
def mock_db():
    return MagicMock()


# ── _now_local ──────────────────────────────────────────────────────────────

def test_now_local():
    result = InteractionService._now_local()
    assert isinstance(result, datetime)


# ── _canonical_status ───────────────────────────────────────────────────────

def test_canonical_status_entregado():
    assert InteractionService._canonical_status("entregado") == "Entregado"
    assert InteractionService._canonical_status("DELIVERED") == "Entregado"
    assert InteractionService._canonical_status("  Entregado  ") == "Entregado"


def test_canonical_status_other():
    assert InteractionService._canonical_status("pending") == "pending"
    assert InteractionService._canonical_status("") == ""
    assert InteractionService._canonical_status(None) == ""


# ── _serialize_review ───────────────────────────────────────────────────────

def test_serialize_review_with_user():
    review = MagicMock(spec=Review)
    review.id = 1
    review.product_id = 5
    review.user_id = 2
    review.rating = 4
    review.comment = "Muy bueno"
    review.created_at = datetime(2024, 1, 15)
    user = MagicMock()
    user.first_name = "Juan"
    user.last_name = "Perez"
    user.email = "juan@test.com"
    review.user = user

    result = InteractionService._serialize_review(review)
    assert result["id"] == 1
    assert result["userName"] == "Juan Perez"
    assert result["rating"] == 4


def test_serialize_review_without_user():
    review = MagicMock(spec=Review)
    review.id = 1
    review.product_id = 5
    review.user_id = 2
    review.rating = 3
    review.comment = None
    review.created_at = None
    review.user = None

    result = InteractionService._serialize_review(review)
    assert result["userName"] == "Cliente"


def test_serialize_review_user_no_name():
    review = MagicMock(spec=Review)
    review.id = 1
    review.product_id = 5
    review.user_id = 2
    review.rating = 5
    review.comment = "Great"
    review.created_at = datetime(2024, 1, 1)
    user = MagicMock()
    user.first_name = ""
    user.last_name = ""
    user.email = "user@test.com"
    review.user = user

    result = InteractionService._serialize_review(review)
    assert result["userName"] == "user@test.com"


# ── _serialize_notification ─────────────────────────────────────────────────

def test_serialize_notification():
    notif = MagicMock(spec=Notification)
    notif.id = 10
    notif.user_id = 1
    notif.title = "Test"
    notif.message = "Hello"
    notif.type = "info"
    notif.link_url = "/dashboard"
    notif.is_read = False
    notif.created_at = datetime(2024, 6, 1)

    result = InteractionService._serialize_notification(notif)
    assert result["id"] == 10
    assert result["isRead"] is False
    assert result["linkUrl"] == "/dashboard"


def test_serialize_notification_no_created_at():
    notif = MagicMock(spec=Notification)
    notif.id = 10
    notif.user_id = 1
    notif.title = "Test"
    notif.message = "Hello"
    notif.type = None
    notif.link_url = None
    notif.is_read = True
    notif.created_at = None

    result = InteractionService._serialize_notification(notif)
    assert "createdAt" in result


# ── create_review ───────────────────────────────────────────────────────────

def test_create_review_invalid_rating(mock_db):
    with pytest.raises(ValueError, match="valoración"):
        InteractionService.create_review(mock_db, 1, 1, 10)


def test_create_review_product_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(ValueError, match="Producto no encontrado"):
        InteractionService.create_review(mock_db, 1, 1, 4)


def test_create_review_no_delivered_stage(mock_db):
    product = MagicMock(spec=Product)
    # First query = product, second query = production stage (None)
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        product, None]
    with pytest.raises(ValueError, match="entregados"):
        InteractionService.create_review(mock_db, 1, 1, 4)


def test_create_review_no_delivered_order(mock_db):
    product = MagicMock(spec=Product)
    stage = MagicMock(spec=ProductionStage)
    stage.id = 5
    # Product found, stage found, but no delivered order
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        product, stage]
    mock_db.query.return_value.join.return_value.filter.return_value.filter.return_value.filter.return_value.first.return_value = None  # noqa: E501
    with pytest.raises(ValueError, match="entregados"):
        InteractionService.create_review(mock_db, 1, 1, 4)


# ── list_product_reviews ────────────────────────────────────────────────────

def test_list_product_reviews(mock_db):
    review = MagicMock(spec=Review)
    review.id = 1
    review.product_id = 1
    review.user_id = 1
    review.rating = 5
    review.comment = "Excellent"
    review.created_at = datetime(2024, 1, 1)
    user = MagicMock()
    user.first_name = "Ana"
    user.last_name = "Lopez"
    user.email = "ana@test.com"
    review.user = user

    mock_db.query.return_value.options.return_value.filter.return_value.order_by.return_value.all.return_value = [
        review]

    result = InteractionService.list_product_reviews(mock_db, 1)
    assert result["totalItems"] == 1
    assert result["items"][0]["userName"] == "Ana Lopez"


def test_list_product_reviews_empty(mock_db):
    mock_db.query.return_value.options.return_value.filter.return_value.order_by.return_value.all.return_value = []
    result = InteractionService.list_product_reviews(mock_db, 1)
    assert result["totalItems"] == 0
    assert result["items"] == []


# ── list_user_notifications ─────────────────────────────────────────────────

def test_list_user_notifications(mock_db):
    notif = MagicMock(spec=Notification)
    notif.id = 1
    notif.user_id = 1
    notif.title = "Test"
    notif.message = "Msg"
    notif.type = "info"
    notif.link_url = None
    notif.is_read = False
    notif.created_at = datetime(2024, 1, 1)

    q1 = MagicMock()
    q1.filter.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [
        notif]

    q2 = MagicMock()
    q2.filter.return_value.count.return_value = 1

    mock_db.query.side_effect = [q1, q2]

    result = InteractionService.list_user_notifications(mock_db, 1)
    assert result["unreadCount"] == 1
    assert len(result["items"]) == 1


# ── mark_notification_as_read ───────────────────────────────────────────────

def test_mark_notification_as_read_success(mock_db):
    notif = MagicMock(spec=Notification)
    notif.id = 5
    notif.user_id = 1
    notif.title = "T"
    notif.message = "M"
    notif.type = "info"
    notif.link_url = None
    notif.is_read = False
    notif.created_at = datetime(2024, 1, 1)

    mock_db.query.return_value.filter.return_value.first.return_value = notif

    result = InteractionService.mark_notification_as_read(mock_db, 1, 5)
    assert notif.is_read is True
    mock_db.flush.assert_called()
    assert result["id"] == 5


def test_mark_notification_as_read_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(ValueError, match="Notificación no encontrada"):
        InteractionService.mark_notification_as_read(mock_db, 1, 999)


# ── create_delivery_review_notification ─────────────────────────────────────

def test_create_delivery_review_notification(mock_db):
    notif = MagicMock(spec=Notification)
    notif.id = 7
    notif.user_id = 1
    notif.title = "Tu pedido fue entregado"
    notif.message = "Tu pedido #1 para Test ya fue entregado."
    notif.type = "order-delivered-review"
    notif.link_url = "/marketplace/5?review=1&notification=7"
    notif.is_read = False
    notif.created_at = datetime(2024, 1, 1)

    def add_side_effect(obj):
        if isinstance(obj, Notification):
            obj.id = 7

    mock_db.add.side_effect = add_side_effect

    result = InteractionService.create_delivery_review_notification(
        mock_db, user_id=1, order_id=1, product_id=5, product_name="Test"
    )
    mock_db.add.assert_called_once()
    assert mock_db.flush.called


def test_create_delivery_review_notification_no_name(mock_db):
    def add_side_effect(obj):
        if isinstance(obj, Notification):
            obj.id = 8

    mock_db.add.side_effect = add_side_effect
    InteractionService.create_delivery_review_notification(
        mock_db, user_id=1, order_id=2, product_id=5, product_name=None
    )
    mock_db.add.assert_called_once()
