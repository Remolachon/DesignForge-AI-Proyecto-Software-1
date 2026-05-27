"""
Tests for auth_controller endpoints using FastAPI TestClient.
All external dependencies (Supabase, DB) are mocked.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.security.token_validator import get_current_user
from app.schemas.user_schema import AuthResponse


# ────────────────────────────────────────────────────────────────────────────
# Helpers: fake DB session and fake authenticated user
# ────────────────────────────────────────────────────────────────────────────

def fake_db():
    return MagicMock()


def fake_user():
    user = MagicMock()
    user.id = "supabase-uuid-123"
    user.email = "test@example.com"
    user.user_metadata = {"first_name": "Juan", "last_name": "Perez"}
    return user


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = fake_db
    app.dependency_overrides[get_current_user] = fake_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def client_no_auth():
    """Client WITHOUT authentication override (raw auth required)."""
    app.dependency_overrides[get_db] = fake_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ────────────────────────────────────────────────────────────────────────────
# Tests: register
# ────────────────────────────────────────────────────────────────────────────

class TestRegister:
    def test_register_missing_body_422(self, client_no_auth):
        resp = client_no_auth.post("/auth/register", json={})
        assert resp.status_code == 422

    def test_register_empty_first_name_400(self, client_no_auth):
        with patch("app.controllers.auth_controller.supabase") as mock_supabase:
            payload = {
                "email": "test@example.com",
                "password": "password123",
                "confirm_password": "password123",
                "first_name": "   ",
                "last_name": "Perez",
            }
            resp = client_no_auth.post("/auth/register", json=payload)
            assert resp.status_code == 400

    def test_register_short_password_400(self, client_no_auth):
        payload = {
            "email": "test@example.com",
            "password": "abc",
            "confirm_password": "abc",
            "first_name": "Juan",
            "last_name": "Perez",
        }
        resp = client_no_auth.post("/auth/register", json=payload)
        assert resp.status_code == 400
        assert "contraseña" in resp.json()["detail"].lower()

    def test_register_passwords_mismatch_400(self, client_no_auth):
        payload = {
            "email": "test@example.com",
            "password": "password123",
            "confirm_password": "other456",
            "first_name": "Juan",
            "last_name": "Perez",
        }
        resp = client_no_auth.post("/auth/register", json=payload)
        assert resp.status_code == 400
        assert "contraseñas" in resp.json()["detail"].lower()

    def test_register_invalid_phone_400(self, client_no_auth):
        payload = {
            "email": "test@example.com",
            "password": "password123",
            "confirm_password": "password123",
            "first_name": "Juan",
            "last_name": "Perez",
            "phone": "abc-phone",
        }
        resp = client_no_auth.post("/auth/register", json=payload)
        assert resp.status_code == 400
        assert "teléfono" in resp.json()["detail"].lower()

    @patch("app.controllers.auth_controller.UserService.get_user_role_name",
           return_value="cliente")
    @patch("app.controllers.auth_controller.UserService.assign_default_role")
    @patch("app.controllers.auth_controller.UserService.create_user")
    @patch("app.controllers.auth_controller.UserService.get_user_by_supabase_id",
           return_value=None)
    @patch("app.controllers.auth_controller.EmailService.send_welcome_email",
           return_value={"status": "sent"})
    @patch("app.controllers.auth_controller.supabase")
    def test_register_success_201(
        self, mock_supabase, mock_email, mock_get_user, mock_create,
        mock_assign_role, mock_get_role, client_no_auth
    ):
        mock_auth_response = MagicMock()
        mock_auth_response.user.id = "new-supabase-id"
        mock_auth_response.user.email = "test@example.com"
        mock_auth_response.session.access_token = "jwt-token"
        mock_supabase.auth.sign_up.return_value = mock_auth_response

        new_user = MagicMock()
        new_user.id = 1
        new_user.first_name = "Juan"
        new_user.last_name = "Perez"
        new_user.email = "test@example.com"
        mock_create.return_value = new_user

        payload = {
            "email": "test@example.com",
            "password": "password123",
            "confirm_password": "password123",
            "first_name": "Juan",
            "last_name": "Perez",
        }
        resp = client_no_auth.post("/auth/register", json=payload)
        assert resp.status_code == 201
        assert resp.json()["access_token"] == "jwt-token"

    @patch("app.controllers.auth_controller.supabase")
    def test_register_supabase_already_registered_400(
        self, mock_supabase, client_no_auth):
        from supabase_auth.errors import AuthApiError
        mock_supabase.auth.sign_up.side_effect = AuthApiError(
            "User already registered", 400, "email_already_registered"
        )
        payload = {
            "email": "existing@example.com",
            "password": "password123",
            "confirm_password": "password123",
            "first_name": "Juan",
            "last_name": "Perez",
        }
        resp = client_no_auth.post("/auth/register", json=payload)
        assert resp.status_code == 400
        assert "registrado" in resp.json()["detail"].lower()


# ────────────────────────────────────────────────────────────────────────────
# Tests: login
# ────────────────────────────────────────────────────────────────────────────

class TestLogin:
    def test_login_empty_fields_400(self, client_no_auth):
        # Empty email/password — Pydantic may return 422 or controller returns
        # 400
        resp = client_no_auth.post(
    "/auth/login",
    json={
        "email": "",
         "password": ""})
        assert resp.status_code in (400, 422)

    @patch("app.controllers.auth_controller.supabase")
    def test_login_wrong_credentials_401(self, mock_supabase, client_no_auth):
        from supabase_auth.errors import AuthApiError
        mock_supabase.auth.sign_in_with_password.side_effect = AuthApiError(
            "Invalid credentials", 401, "invalid_credentials"
        )
        resp = client_no_auth.post(
            "/auth/login", json={"email": "test@example.com", "password": "wrongpass"}
        )
        assert resp.status_code == 401

    @patch("app.controllers.auth_controller.UserService.get_user_role_name",
           return_value="cliente")
    @patch("app.controllers.auth_controller.UserService.get_user_by_supabase_id")
    @patch("app.controllers.auth_controller.supabase")
    def test_login_success_200(
        self, mock_supabase, mock_get_user, mock_get_role, client_no_auth):
        mock_auth_response = MagicMock()
        mock_auth_response.user.id = "supabase-id"
        mock_auth_response.user.email = "test@example.com"
        mock_auth_response.user.user_metadata = {}
        mock_auth_response.session.access_token = "jwt-token"
        mock_supabase.auth.sign_in_with_password.return_value = mock_auth_response

        db_user = MagicMock()
        db_user.id = 1
        db_user.first_name = "Juan"
        db_user.last_name = "Perez"
        db_user.supabase_id = "supabase-id"
        mock_get_user.return_value = db_user

        resp = client_no_auth.post(
            "/auth/login", json={"email": "test@example.com", "password": "password123"}
        )
        assert resp.status_code == 200
        assert resp.json()["access_token"] == "jwt-token"


# ────────────────────────────────────────────────────────────────────────────
# Tests: logout
# ────────────────────────────────────────────────────────────────────────────

class TestLogout:
    @patch("app.controllers.auth_controller.supabase")
    def test_logout_204(self, mock_supabase, client_no_auth):
        mock_supabase.auth.sign_out.return_value = None
        resp = client_no_auth.post("/auth/logout")
        assert resp.status_code == 204


# ────────────────────────────────────────────────────────────────────────────
# Tests: helper functions
# ────────────────────────────────────────────────────────────────────────────

class TestHelperFunctions:
    def test_update_user_profile_commits(self):
        from app.controllers.auth_controller import _update_user_profile
        mock_db = MagicMock()
        db_user = MagicMock()
        db_user.first_name = "Old"
        db_user.last_name = "Name"
        db_user.phone = None

        _update_user_profile(
    mock_db,
    db_user,
    first_name="New",
    last_name="Name",
     phone="1234567890")
        assert db_user.first_name == "New"
        mock_db.commit.assert_called_once()

    def test_update_user_profile_no_changes(self):
        from app.controllers.auth_controller import _update_user_profile
        mock_db = MagicMock()
        db_user = MagicMock()
        db_user.first_name = "Juan"
        db_user.last_name = "Perez"
        db_user.phone = None

        _update_user_profile(
    mock_db,
    db_user,
    first_name="Juan",
     last_name="Perez")
        mock_db.commit.assert_not_called()

    def test_link_google_account(self):
        from app.controllers.auth_controller import _link_google_account
        mock_db = MagicMock()
        db_user = MagicMock()
        db_user.supabase_id = "old-id"
        db_user.first_name = "Juan"
        db_user.last_name = "Perez"
        db_user.phone = None

        _link_google_account(
    mock_db,
    db_user,
    supabase_id="new-id",
    first_name="Juan",
     last_name="Perez")
        assert db_user.supabase_id == "new-id"
        mock_db.commit.assert_called_once()

    def test_send_welcome_email_logs_error(self):
        from app.controllers.auth_controller import _send_welcome_email
        with patch("app.controllers.auth_controller.EmailService.send_welcome_email",
                   return_value={"status": "error", "error": "Network failure"}):
            # Should not raise, just log a warning
            _send_welcome_email("test@example.com", "Juan")

    def test_build_auth_response(self):
        from app.controllers.auth_controller import _build_auth_response
        mock_db = MagicMock()
        db_user = MagicMock()
        db_user.id = 1
        db_user.first_name = "Juan"
        db_user.last_name = "Perez"
        with patch("app.controllers.auth_controller.UserService.get_user_role_name", return_value="cliente"):
            resp = _build_auth_response(mock_db, db_user, "jwt-token")
            assert resp.access_token == "jwt-token"
            assert resp.role == "cliente"


# ────────────────────────────────────────────────────────────────────────────
# Tests: google_oauth
# ────────────────────────────────────────────────────────────────────────────

class TestGoogleOAuth:
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.verify_supabase_token", return_value=None)
    def test_google_oauth_invalid_token_401(self, mock_verify, client_no_auth):
        resp = client_no_auth.post(
    "/auth/google-oauth",
    json={
        "access_token": "bad-token"})
        assert resp.status_code == 401
        assert "inválido" in resp.json()["detail"].lower()

    @patch("app.controllers.auth_controller.GoogleOAuthProvider.verify_supabase_token",
           return_value={"sub": "123"})
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.extract_user_info", return_value={})
    def test_google_oauth_missing_info_401(
        self, mock_extract, mock_verify, client_no_auth):
        resp = client_no_auth.post(
    "/auth/google-oauth",
    json={
        "access_token": "valid-token"})
        assert resp.status_code == 401
        assert "validar la cuenta" in resp.json()["detail"].lower()

    @patch("app.controllers.auth_controller._build_auth_response")
    @patch("app.controllers.auth_controller.UserService.get_user_by_supabase_id",
           return_value=None)
    @patch("app.controllers.auth_controller.UserService.get_user_by_email",
           return_value=None)
    @patch("app.controllers.auth_controller.UserService.create_user")
    @patch("app.controllers.auth_controller.UserService.assign_default_role")
    @patch("app.controllers.auth_controller._send_welcome_email")
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.extract_user_info")
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.verify_supabase_token",
           return_value={"sub": "123"})
    def test_google_oauth_new_user(
        self, mock_verify, mock_extract, mock_welcome, mock_assign, mock_create, mock_get_email, mock_get_supa, mock_build, client_no_auth  # noqa: E501
    ):
        mock_extract.return_value = {
            "supabase_id": "supa-123",
            "email": "test@google.com",
            "first_name": "Test",
            "last_name": "Google",
            "phone": "123",
        }
        db_user = MagicMock()
        mock_create.return_value = db_user

        auth_resp = AuthResponse(
            access_token="jwt-token",
            token_type="bearer",
            first_name="Test",
            last_name="Google",
            role="cliente"
        )
        mock_build.return_value = auth_resp

        resp = client_no_auth.post(
    "/auth/google-oauth",
    json={
        "access_token": "valid-token"})
        assert resp.status_code == 200
        mock_create.assert_called_once()
        mock_assign.assert_called_once()

    @patch("app.controllers.auth_controller._build_auth_response")
    @patch("app.controllers.auth_controller._link_google_account")
    @patch("app.controllers.auth_controller.UserService.get_user_by_supabase_id",
           return_value=None)
    @patch("app.controllers.auth_controller.UserService.get_user_by_email")
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.extract_user_info")
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.verify_supabase_token",
           return_value={"sub": "123"})
    def test_google_oauth_link_existing_user(
        self, mock_verify, mock_extract, mock_get_email, mock_get_supa, mock_link, mock_build, client_no_auth
    ):
        mock_extract.return_value = {
            "supabase_id": "new-supa-123",
            "email": "test@google.com",
        }
        db_user = MagicMock()
        db_user.supabase_id = "old-supa-id"
        mock_get_email.return_value = db_user

        auth_resp = AuthResponse(
            access_token="jwt-token",
            token_type="bearer",
            first_name="Test",
            last_name="Google",
            role="cliente"
        )
        mock_build.return_value = auth_resp

        resp = client_no_auth.post(
    "/auth/google-oauth",
    json={
        "access_token": "valid-token"})
        assert resp.status_code == 200
        mock_link.assert_called_once()

    @patch("app.controllers.auth_controller._build_auth_response")
    @patch("app.controllers.auth_controller._update_user_profile")
    @patch("app.controllers.auth_controller.UserService.get_user_by_supabase_id")
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.extract_user_info")
    @patch("app.controllers.auth_controller.GoogleOAuthProvider.verify_supabase_token",
           return_value={"sub": "123"})
    def test_google_oauth_update_existing_user(
        self, mock_verify, mock_extract, mock_get_supa, mock_update, mock_build, client_no_auth
    ):
        mock_extract.return_value = {
            "supabase_id": "supa-123",
            "email": "test@google.com",
        }
        db_user = MagicMock()
        db_user.supabase_id = "supa-123"
        mock_get_supa.return_value = db_user

        auth_resp = AuthResponse(
            access_token="jwt-token",
            token_type="bearer",
            first_name="Test",
            last_name="Google",
            role="cliente"
        )
        mock_build.return_value = auth_resp

        resp = client_no_auth.post(
    "/auth/google-oauth",
    json={
        "access_token": "valid-token"})
        assert resp.status_code == 200
        mock_update.assert_called_once()

    @patch("app.controllers.auth_controller.GoogleOAuthProvider.verify_supabase_token",
           side_effect=Exception("Database down"))
    def test_google_oauth_exception_500(self, mock_verify, client_no_auth):
        resp = client_no_auth.post(
    "/auth/google-oauth",
    json={
        "access_token": "valid-token"})
        assert resp.status_code == 500
        assert "error al procesar" in resp.json()["detail"].lower()
