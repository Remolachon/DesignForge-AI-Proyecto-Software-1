"""
Tests for user_controller and company_controller endpoints.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.security.token_validator import get_current_user


# ────────────────────────────────────────────────────────────────────────────
# Fake dependencies
# ────────────────────────────────────────────────────────────────────────────

def make_fake_db():
    return MagicMock()


def make_fake_user(role="cliente", supabase_id="test-uuid",
                   user_id=1, company_id=None):
    user = MagicMock()
    user.id = supabase_id
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


@pytest.fixture
def admin_client():
    app.dependency_overrides[get_db] = make_fake_db
    app.dependency_overrides[get_current_user] = lambda: make_fake_user(
        role="administrador")
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ────────────────────────────────────────────────────────────────────────────
# User controller tests
# ────────────────────────────────────────────────────────────────────────────

class TestUserController:

    @patch("app.controllers.user_controller.retry_on_connection_error")
    @patch("app.controllers.user_controller.UserService.get_user_by_supabase_id")
    def test_get_me_returns_user(self, mock_get_user, mock_retry, client):
        db_user = MagicMock()
        db_user.id = 1
        db_user.email = "test@example.com"
        db_user.first_name = "Juan"
        db_user.last_name = "Perez"
        db_user.phone = None
        db_user.company_id = None
        db_user.is_active = True

        mock_retry.side_effect = lambda fn, **kwargs: fn()
        mock_get_user.return_value = db_user

        resp = client.get("/users/me")
        assert resp.status_code == 200

    @patch("app.controllers.user_controller.retry_on_connection_error")
    @patch("app.controllers.user_controller.UserService.get_user_role_name",
           return_value="cliente")
    @patch("app.controllers.user_controller.UserService.get_user_by_supabase_id")
    def test_get_my_role(self, mock_get_user,
                         mock_get_role, mock_retry, client):
        db_user = MagicMock()
        db_user.id = 1
        db_user.company_id = None
        mock_get_user.return_value = db_user

        mock_retry.side_effect = lambda fn, **kwargs: fn()

        resp = client.get("/users/me/role")
        assert resp.status_code == 200
        assert resp.json()["role"] == "cliente"

    @patch("app.controllers.user_controller.retry_on_connection_error")
    @patch("app.controllers.user_controller.UserService.get_user_by_supabase_id",
           return_value=None)
    def test_get_my_role_user_not_found_404(
        self, mock_get_user, mock_retry, client):
        mock_retry.side_effect = lambda fn, **kwargs: fn()

        resp = client.get("/users/me/role")
        assert resp.status_code == 404

    @patch("app.controllers.user_controller.retry_on_connection_error")
    @patch("app.controllers.user_controller.UserService.create_user")
    @patch("app.controllers.user_controller.UserService.get_user_by_supabase_id",
           return_value=None)
    def test_get_me_creates_user_if_not_found(
        self, mock_get_user, mock_create, mock_retry, client):
        created_user = MagicMock()
        created_user.id = 2
        created_user.email = "test@example.com"
        created_user.first_name = "Juan"
        created_user.last_name = "Perez"
        created_user.phone = None
        created_user.company_id = None
        created_user.is_active = True
        mock_create.return_value = created_user
        mock_retry.side_effect = lambda fn, **kwargs: fn()

        resp = client.get("/users/me")
        assert resp.status_code == 200
        mock_create.assert_called_once()


# ────────────────────────────────────────────────────────────────────────────
# Company controller tests
# ────────────────────────────────────────────────────────────────────────────

class TestCompanyController:

    @patch("app.controllers.company_controller.UserService.get_user_role_name",
           return_value="administrador")
    @patch("app.controllers.company_controller.UserService.get_user_by_supabase_id")
    @patch("app.controllers.company_controller.CompanyService.get_admin_companies")
    def test_get_admin_companies(
        self, mock_list, mock_get_user, mock_get_role, client):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user
        mock_list.return_value = []

        resp = client.get("/companies/admin")
        assert resp.status_code == 200
        assert resp.json() == []

    @patch("app.controllers.company_controller.UserService.get_user_role_name",
           return_value="cliente")
    @patch("app.controllers.company_controller.UserService.get_user_by_supabase_id")
    def test_get_admin_companies_forbidden_non_admin(
        self, mock_get_user, mock_get_role, client):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        resp = client.get("/companies/admin")
        assert resp.status_code == 403

    @patch("app.controllers.company_controller.UserService.get_user_role_name",
           return_value="administrador")
    @patch("app.controllers.company_controller.UserService.get_user_by_supabase_id")
    @patch("app.controllers.company_controller.CompanyService.get_admin_company_counts")
    def test_get_admin_company_counts(
        self, mock_counts, mock_get_user, mock_get_role, client):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user
        mock_counts.return_value = {
    "total": 10,
    "pending": 2,
    "active": 5,
    "rejected": 1,
     "inactive": 2}

        resp = client.get("/companies/admin/counts")
        assert resp.status_code == 200
        assert resp.json()["total"] == 10

    @patch("app.controllers.company_controller.UserService.get_user_role_name")
    @patch("app.controllers.company_controller.UserService.get_user_by_supabase_id")
    @patch("app.controllers.company_controller.CompanyService.create_company")
    def test_create_company_success(
        self, mock_create, mock_get_user, mock_get_role, client):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user
        mock_get_role.return_value = "funcionario_adm"

        mock_company = MagicMock()
        mock_company.id = 1
        mock_company.nit = "123"
        mock_company.name = "Test Inc"
        mock_company.description = None
        mock_company.address = None
        mock_company.phone = None
        mock_company.email = "test@example.com"
        mock_company.start_date = "2024-01-01T00:00:00"
        mock_company.status = "PENDING"
        mock_company.is_active = False
        mock_company.created_by_user_id = 1
        mock_create.return_value = mock_company

        payload = {"nit": "123", "name": "Test Inc"}
        resp = client.post("/companies", json=payload)
        assert resp.status_code == 201
        assert resp.json()["nit"] == "123"

    @patch("app.controllers.company_controller.UserService.get_user_role_name",
           return_value="administrador")
    @patch("app.controllers.company_controller.UserService.get_user_by_supabase_id")
    @patch("app.controllers.company_controller.CompanyService.update_company_status")
    def test_update_company_status(
        self, mock_update, mock_get_user, mock_get_role, client):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        mock_company = MagicMock()
        mock_company.id = 1
        mock_company.nit = "123"
        mock_company.name = "Test"
        mock_company.description = None
        mock_company.address = None
        mock_company.phone = None
        mock_company.email = "test@example.com"
        mock_company.start_date = "2024-01-01T00:00:00"
        mock_company.status = "APPROVED"
        mock_company.is_active = True
        mock_company.created_by_user_id = 1
        mock_company.new_role = None  # Required by CompanyResponse Pydantic model
        mock_update.return_value = mock_company

        resp = client.put("/companies/1/status", json={"status": "APPROVED"})
        assert resp.status_code == 200

    @patch("app.controllers.company_controller.UserService.get_user_role_name",
           return_value="administrador")
    @patch("app.controllers.company_controller.UserService.get_user_by_supabase_id")
    @patch("app.controllers.company_controller.CompanyService.delete_company")
    def test_delete_company(
        self, mock_delete, mock_get_user, mock_get_role, client):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_get_user.return_value = mock_user

        mock_company = MagicMock()
        mock_company.id = 1
        mock_company.nit = "123"
        mock_company.name = "Test"
        mock_company.description = None
        mock_company.address = None
        mock_company.phone = None
        mock_company.email = "test@example.com"
        mock_company.start_date = "2024-01-01T00:00:00"
        mock_company.status = "APPROVED"
        mock_company.is_active = False
        mock_company.created_by_user_id = 1
        mock_company.new_role = None  # Required by CompanyResponse Pydantic model
        mock_delete.return_value = mock_company

        resp = client.delete("/companies/1")
        assert resp.status_code == 200
