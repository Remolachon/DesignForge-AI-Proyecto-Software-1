# backend/tests/conftest.py
# Configuración global de pytest para DesignForge-AI

import os
import pytest

# Marca la ejecución como entorno de pruebas
os.environ.setdefault("TESTING", "true")


def pytest_configure(config):
    """Registra marcadores personalizados."""
    config.addinivalue_line("markers", "integration: pruebas de integración (requieren BD)")
    config.addinivalue_line("markers", "unit: pruebas unitarias sin dependencias externas")
