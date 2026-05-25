"""
Pruebas básicas para el backend DesignForge-AI (FastAPI).
Ubicación: backend/tests/test_main.py

Ejecutar con: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient

# Importa tu aplicación principal — ajusta el import según tu estructura
from app.main import app

# ─────────────────────────────────────────────────────────────────────────────
# FIXTURE: cliente de prueba
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """
    Crea un TestClient de FastAPI para ejecutar peticiones HTTP sin levantar
    un servidor real.
    Descomenta la línea con `app` cuando tu aplicación esté lista.
    """
    return TestClient(app)
    pass


# ─────────────────────────────────────────────────────────────────────────────
# PRUEBAS DE SALUD (Health Check)
# ─────────────────────────────────────────────────────────────────────────────

class TestHealthCheck:
    """Verifica que el servidor responde correctamente."""

    def test_root_returns_200(self, client):
        """GET / debe devolver 200."""
        if client is None:
            pytest.skip("Activa el cliente cuando app.main esté disponible.")
        response = client.get("/")
        assert response.status_code == 200

    def test_docs_endpoint_available(self, client):
        """GET /docs debe estar disponible en modo desarrollo."""
        if client is None:
            pytest.skip("Activa el cliente cuando app.main esté disponible.")
        response = client.get("/docs")
        assert response.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# PRUEBAS DE AUTENTICACIÓN
# ─────────────────────────────────────────────────────────────────────────────

class TestAuth:
    """Pruebas sobre los endpoints de autenticación."""

    def test_register_missing_fields_returns_422(self, client):
        """POST /auth/register sin body debe devolver error de validación."""
        if client is None:
            pytest.skip("Activa el cliente cuando app.main esté disponible.")
        response = client.post("/auth/register", json={})
        assert response.status_code == 422

    def test_login_wrong_credentials_returns_401(self, client):
        """POST /auth/login con credenciales incorrectas debe devolver 401."""
        if client is None:
            pytest.skip("Activa el cliente cuando app.main esté disponible.")
        response = client.post(
            "/auth/login",
            json={"email": "noexiste@test.com", "password": "wrongpassword"},
        )
        assert response.status_code in (401, 400)


# ─────────────────────────────────────────────────────────────────────────────
# PRUEBAS DE USUARIOS
# ─────────────────────────────────────────────────────────────────────────────

class TestUsers:
    """Pruebas sobre los endpoints de usuarios."""

    def test_get_users_without_auth_returns_401(self, client):
        """GET /users/me sin token debe devolver 401."""
        if client is None:
            pytest.skip("Activa el cliente cuando app.main esté disponible.")
        response = client.get("/users/me")
        assert response.status_code == 401


# ─────────────────────────────────────────────────────────────────────────────
# PRUEBAS UNITARIAS DE LÓGICA (sin HTTP)
# ─────────────────────────────────────────────────────────────────────────────

class TestUnitLogic:
    """Pruebas unitarias de funciones de lógica de negocio."""

    def test_placeholder_always_passes(self):
        """
        Prueba placeholder — reemplázala con lógica real.
        Ejemplo: from app.services.user_service import hash_password
        """
        assert True

    def test_email_validation_format(self):
        """Valida que correos con formato incorrecto sean rechazados."""
        import re
        pattern = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"
        assert re.match(pattern, "usuario@ejemplo.com")
        assert not re.match(pattern, "correo-invalido")
