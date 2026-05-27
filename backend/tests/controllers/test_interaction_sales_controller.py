"""
Tests for interaction_controller and sales_controller endpoints.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.security.token_validator import get_current_user


def make_fake_db():
    return MagicMock()


def make_fake_user():
    user = MagicMock()
    user.id = "supabase-uuid-123"
    user.email = "test@example.com"
    user.user_metadata = {}
    return user


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = make_fake_db
    app.dependency_overrides[get_current_user] = make_fake_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ────────────────────────────────────────────────────────────────────────────
# Interaction controller tests
# ────────────────────────────────────────────────────────────────────────────

class TestInteractionController:

    @patch("app.controllers.interaction_controller.InteractionService.list_product_reviews")
    def test_get_product_reviews(self, mock_reviews, client):
        mock_reviews.return_value = {
            "items": [],
            "totalItems": 0,
        }
        resp = client.get("/products/1/reviews")
        assert resp.status_code == 200
        assert resp.json()["totalItems"] == 0

    @patch("app.controllers.interaction_controller.retry_on_connection_error")
    @patch("app.controllers.interaction_controller.InteractionService.create_review")
    def test_create_review_success(self, mock_create, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()

        mock_review = MagicMock()
        mock_review.id = 1
        mock_review.productId = 1
        mock_review.userId = 1
        mock_review.rating = 5
        mock_review.comment = "Excelente"
        mock_review.createdAt = "2024-01-01"
        mock_review.userName = "Juan Perez"
        mock_create.return_value = mock_review

        payload = {"product_id": 1, "rating": 5, "comment": "Excelente"}
        resp = client.post("/reviews", json=payload)
        assert resp.status_code == 200

    @patch("app.controllers.interaction_controller.retry_on_connection_error")
    @patch("app.controllers.interaction_controller.InteractionService.create_review")
    def test_create_review_value_error_400(
        self, mock_create, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()
        mock_create.side_effect = ValueError(
            "Ya existe un review para este producto")

        payload = {"product_id": 1, "rating": 5, "comment": "Excelente"}
        resp = client.post("/reviews", json=payload)
        assert resp.status_code == 400

    @patch("app.controllers.interaction_controller.retry_on_connection_error")
    @patch("app.controllers.interaction_controller.InteractionService.list_user_notifications")
    def test_get_notifications(self, mock_list, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()
        mock_list.return_value = {
            "items": [],
            "unreadCount": 0,
        }
        resp = client.get("/notifications")
        assert resp.status_code == 200

    @patch("app.controllers.interaction_controller.retry_on_connection_error")
    @patch("app.controllers.interaction_controller.InteractionService.mark_notification_as_read")
    def test_mark_notification_as_read(self, mock_mark, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()

        mock_notif = MagicMock()
        mock_notif.id = 1
        mock_notif.userId = 1
        mock_notif.title = "Test"
        mock_notif.message = "Hello"
        mock_notif.type = "info"
        mock_notif.isRead = True
        mock_notif.linkUrl = None
        mock_notif.createdAt = "2024-01-01T00:00:00"
        mock_mark.return_value = mock_notif

        resp = client.patch("/notifications/1/read")
        assert resp.status_code == 200

    @patch("app.controllers.interaction_controller.retry_on_connection_error")
    @patch("app.controllers.interaction_controller.InteractionService.mark_notification_as_read")
    def test_mark_notification_not_found_404(
        self, mock_mark, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()
        mock_mark.side_effect = ValueError("Notificación no encontrada")

        resp = client.patch("/notifications/999/read")
        assert resp.status_code == 404


# ────────────────────────────────────────────────────────────────────────────
# Sales controller tests
# ────────────────────────────────────────────────────────────────────────────

class TestSalesController:

    def _make_admin_user(self, db_mock):
        db_user = MagicMock()
        db_user.id = 1
        db_user.company_id = None
        return db_user

    @patch("app.controllers.sales_controller.retry_on_connection_error")
    @patch("app.controllers.sales_controller.UserService.get_user_role_name",
           return_value="administrador")
    @patch("app.controllers.sales_controller.get_sales_summary")
    def test_get_summary(self, mock_summary, mock_role, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()
        mock_summary.return_value = {
            "total_ventas": 1000.0,
            "total_ganancias": 500.0,
            "total_transacciones": 10,
            "transacciones_aprobadas": 9,
            "ticket_promedio": 100.0,
            "tasa_aprobacion": 0.9,
        }
        resp = client.get("/admin/sales/summary")
        assert resp.status_code == 200

    @patch("app.controllers.sales_controller.retry_on_connection_error")
    @patch("app.controllers.sales_controller.UserService.get_user_role_name",
           return_value="administrador")
    @patch("app.controllers.sales_controller.get_sales_chart")
    def test_get_chart(self, mock_chart, mock_role, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()
        mock_chart.return_value = {
            "filter": "month",
            "data": [],
        }
        resp = client.get("/admin/sales/chart")
        assert resp.status_code == 200

    @patch("app.controllers.sales_controller.retry_on_connection_error")
    @patch("app.controllers.sales_controller.UserService.get_user_role_name",
           return_value="administrador")
    @patch("app.controllers.sales_controller.get_transactions_list")
    def test_get_transactions(self, mock_txns, mock_role, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()
        mock_txns.return_value = {
            "total": 0,
            "items": [],
        }
        resp = client.get("/admin/sales/transactions")
        assert resp.status_code == 200

    @patch("app.controllers.sales_controller.retry_on_connection_error")
    @patch("app.controllers.sales_controller.UserService.get_user_role_name",
           return_value="cliente")
    def test_get_summary_non_admin_403(self, mock_role, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kw: fn()
        resp = client.get("/admin/sales/summary")
        assert resp.status_code == 403
