# backend/tests/conftest.py
# Configuración global de pytest para DesignForge-AI

import os
import pytest

# ✅ IMPORTANTE: Configurar DATABASE_URL ANTES de importar app
os.environ.setdefault("TESTING", "true")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

# Asegurar que las claves API están definidas (aunque sea vacías)
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("JWT_SECRET", "test-secret-key")


def pytest_configure(config):
    """Registra marcadores personalizados."""
    config.addinivalue_line("markers", "integration: pruebas de integración (requieren BD)")
    config.addinivalue_line("markers", "unit: pruebas unitarias sin dependencias externas")
