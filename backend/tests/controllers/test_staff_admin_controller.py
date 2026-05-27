"""
Tests for staff_controller and admin_controller endpoints.
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
    user.user_metadata = {"first_name": "Juan", "last_name": "Perez"}
    return user


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = make_fake_db
    app.dependency_overrides[get_current_user] = make_fake_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─── Helper to mock _require_funcionario_adm ────────────────────────────

def mock_adm_helper(db_user_id=1, company_id=10):
    """Returns a mock db_user and company_id tuple."""
    db_user = MagicMock()
    db_user.id = db_user_id
    db_user.company_id = company_id
    return db_user, company_id


# ────────────────────────────────────────────────────────────────────────────
# Staff controller tests
# ────────────────────────────────────────────────────────────────────────────

class TestStaffController:

    @patch("app.controllers.staff_controller._require_funcionario_adm",
           return_value=mock_adm_helper())
    @patch("app.controllers.staff_controller.staff_service.get_company_staff",
           return_value=[{"id": 2, "first_name": "Maria", "email": "m@e.com"}])
    def test_list_staff(self, mock_list, mock_require, client):
        resp = client.get("/staff/")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    @patch("app.controllers.staff_controller._require_funcionario_adm",
           return_value=mock_adm_helper())
    @patch("app.controllers.staff_controller.staff_service.assign_funcionario_role",
           return_value={"message": "Rol 'funcionario' asignado correctamente", "user_id": 5})
    def test_assign_staff(self, mock_assign, mock_require, client):
        resp = client.post("/staff/5/assign")
        assert resp.status_code == 200
        assert "asignado" in resp.json()["message"]

    @patch("app.controllers.staff_controller._require_funcionario_adm",
           return_value=mock_adm_helper())
    @patch("app.controllers.staff_controller.staff_service.revoke_funcionario_role",
           return_value={"message": "Rol 'funcionario' revocado correctamente", "user_id": 5})
    def test_revoke_staff(self, mock_revoke, mock_require, client):
        resp = client.delete("/staff/5/revoke")
        assert resp.status_code == 200
        assert "revocado" in resp.json()["message"]

    @patch("app.controllers.staff_controller._require_funcionario_adm",
           return_value=mock_adm_helper())
    @patch("app.controllers.staff_controller.staff_service.invite_funcionario",
           return_value={"message": "Usuario invitado correctamente", "user_id": 7})
    def test_invite_staff(self, mock_invite, mock_require, client):
        resp = client.post("/staff/invite", json={"email": "new@company.com"})
        assert resp.status_code == 200
        assert "invitado" in resp.json()["message"]

    @patch("app.controllers.staff_controller._require_funcionario_adm",
           return_value=mock_adm_helper())
    def test_invite_staff_no_email_400(self, mock_require, client):
        resp = client.post("/staff/invite", json={})
        assert resp.status_code == 400

    @patch("app.controllers.staff_controller._require_funcionario_adm",
           return_value=mock_adm_helper())
    @patch("app.controllers.staff_controller.staff_service.remove_funcionario_from_company",
           return_value={"message": "Usuario removido de la empresa correctamente", "user_id": 5})
    def test_remove_staff(self, mock_remove, mock_require, client):
        resp = client.delete("/staff/5/remove")
        assert resp.status_code == 200
        assert "removido" in resp.json()["message"]


# ────────────────────────────────────────────────────────────────────────────
# Admin controller tests
# ────────────────────────────────────────────────────────────────────────────

class TestAdminController:

    @patch("app.controllers.admin_controller._require_admin_with_retry")
    @patch("app.controllers.admin_controller.OrderService.get_dashboard_data")
    @patch("app.controllers.admin_controller.CompanyService.get_admin_company_counts")
    @patch("app.controllers.admin_controller.get_all_time_summary")
    def test_get_admin_dashboard(
        self, mock_sales, mock_counts, mock_orders, mock_require, client
    ):
        admin_user = MagicMock()
        admin_user.id = 1
        mock_require.return_value = admin_user

        mock_orders.return_value = {
            "orders": [{"id": 1}, {"id": 2}, {"id": 3}]}
        mock_counts.return_value = {
            "total": 10, "active": 5, "pending": 2, "inactive": 3, "rejected": 0
        }
        mock_sales.return_value = {
            "total_ventas": 1000.0,
            "total_ganancias": 500.0,
            "total_transacciones": 20,
            "transacciones_aprobadas": 18,
            "ticket_promedio": 50.0,
            "tasa_aprobacion": 0.9,
        }

        # Mock the DB query for Role and User count
        with patch("app.controllers.admin_controller.retry_on_connection_error",
                   side_effect=lambda fn, **kw: fn()):
            resp = client.get("/admin/dashboard")

        assert resp.status_code == 200
        data = resp.json()
        assert "stats" in data
        assert "orders" in data

    @patch("app.controllers.admin_controller._require_admin_with_retry")
    @patch("app.controllers.admin_controller.OrderService.get_admin_orders_page")
    def test_get_admin_orders_page(
        self, mock_orders_page, mock_require, client):
        admin_user = MagicMock()
        admin_user.id = 1
        mock_require.return_value = admin_user

        mock_orders_page.return_value = {
            "items": [],
            "page": 1,
            "pageSize": 10,
            "totalItems": 0,
            "totalPages": 1,
        }

        resp = client.get("/admin/orders/page?page=1&page_size=10")
        assert resp.status_code == 200
