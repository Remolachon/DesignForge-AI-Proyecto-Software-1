import pytest
import app.main  # Forzar inicialización de mappers de SQLAlchemy
from unittest.mock import MagicMock, patch
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.services.user_service import UserService
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole


@pytest.fixture
def mock_db():
    return MagicMock()


# --- Tests para Métodos de Búsqueda y Normalización ---

def test_normalize_email():
    # Probamos el método estático privado indirectamente o directo
    assert UserService._normalize_email(
        "  TEST@LukArt.com  ") == "test@lukart.com"


def test_get_user_by_supabase_id(mock_db):
    mock_user = User(id=1, supabase_id="sb-123")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user

    result = UserService.get_user_by_supabase_id(mock_db, "sb-123")
    assert result.id == 1
    assert result.supabase_id == "sb-123"


def test_get_user_by_email(mock_db):
    mock_user = User(id=1, email="duvan@lukart.com")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user

    result = UserService.get_user_by_email(mock_db, "DUVAN@lukart.com")
    assert result.id == 1


# --- Tests para create_user ---

def test_create_user_success(mock_db):
    # Caso 1: Teléfono con espacios se convierte en None, email se normaliza
    result = UserService.create_user(
        db=mock_db,
        email="  Duvan@LukArt.com  ",
        first_name="Duvan",
        last_name="Tech",
        phone="   ",
        supabase_id="sb-999"
    )
    assert result.email == "duvan@lukart.com"
    assert result.phone is None
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_create_user_integrity_error(mock_db):
    # Forzar el lanzamiento de IntegrityError al hacer commit
    mock_db.commit.side_effect = IntegrityError(
        "Duplicate key", {}, BaseException())

    with pytest.raises(HTTPException) as exc_info:
        UserService.create_user(
    mock_db,
    "error@test.com",
    "A",
    "B",
    "123",
     "sb-0")
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert exc_info.value.detail == "El correo ya existe"
    mock_db.rollback.assert_called_once()


# --- Tests para assign_default_role ---

@patch("app.services.user_service.UserService.set_user_role")
def test_assign_default_role(mock_set_role, mock_db):
    UserService.assign_default_role(mock_db, user_id=42)
    mock_set_role.assert_called_once_with(mock_db, 42, "cliente")


# --- Tests para set_user_role (Complejidad de Ramas) ---

def test_set_user_role_role_not_found(mock_db):
    # El rol no existe en la BD
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        UserService.set_user_role(mock_db, user_id=1, role_name="no_existe")
    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


def test_set_user_role_existing_active(mock_db):
    # Caso donde el rol ya estaba activo (se apaga y se vuelve a encender en
    # la lógica)
    mock_role = Role(id=2, name="funcionario")
    mock_user_role = UserRole(user_id=1, role_id=2, is_active=True)

    # Configuramos el mock de get_role_by_name y luego el de active_roles
    mock_db.query.return_value.filter.return_value.first.return_value = mock_role
    mock_db.query.return_value.filter.return_value.all.return_value = [
        mock_user_role]

    UserService.set_user_role(
    mock_db,
    user_id=1,
    role_name="funcionario",
     commit=True)
    assert mock_user_role.is_active is True
    mock_db.commit.assert_called_once()


def test_set_user_role_existing_inactive(mock_db):
    # Caso donde no está activo, pero ya existía una fila inactiva en la BD
    mock_role = Role(id=2, name="funcionario")
    mock_user_role_inactive = UserRole(user_id=1, role_id=2, is_active=False)

    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_role,               # Para get_role_by_name
        mock_user_role_inactive  # Para buscar el registro inactivo
    ]
    mock_db.query.return_value.filter.return_value.all.return_value = [] # No hay activos

    UserService.set_user_role(
    mock_db,
    user_id=1,
    role_name="funcionario",
     commit=False)
    assert mock_user_role_inactive.is_active is True
    mock_db.commit.assert_not_called()


def test_set_user_role_totally_new(mock_db):
    # Caso donde nunca ha tenido ese rol, crea una nueva instancia
    mock_role = Role(id=2, name="funcionario")

    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_role, # Para get_role_by_name
        None       # No hay registro inactivo previo
    ]
    mock_db.query.return_value.filter.return_value.all.return_value = []

    UserService.set_user_role(mock_db, user_id=1, role_name="funcionario")
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called()


# --- Tests para set_user_company ---

def test_set_user_company_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        UserService.set_user_company(mock_db, user_id=1, company_id=10)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_set_user_company_already_same(mock_db):
    mock_user = User(id=1, company_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user

    UserService.set_user_company(mock_db, user_id=1, company_id=10)
    mock_db.commit.assert_not_called()  # Retorno temprano sin guardar nada


def test_set_user_company_success(mock_db):
    mock_user = User(id=1, company_id=None)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user

    UserService.set_user_company(
    mock_db,
    user_id=1,
    company_id=10,
     commit=True)
    assert mock_user.company_id == 10
    mock_db.commit.assert_called_once()


# --- Tests para promote_user_to_funcionario ---

@patch("app.services.user_service.UserService.set_user_role")
@patch("app.services.user_service.UserService.set_user_company")
def test_promote_user_to_funcionario(mock_set_company, mock_set_role, mock_db):
    UserService.promote_user_to_funcionario(
    mock_db, user_id=1, company_id=10, commit=True)
    
    mock_set_company.assert_called_once_with(mock_db, 1, 10, commit=False)
    mock_set_role.assert_called_once_with(
    mock_db, 1, "funcionario", commit=False)
    mock_db.commit.assert_called_once()


# --- Tests para get_user_role_name ---

def test_get_user_role_name_no_active_role(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    assert UserService.get_user_role_name(mock_db, user_id=1) == "cliente"


def test_get_user_role_name_role_record_missing(mock_db):
    mock_user_role = UserRole(user_id=1, role_id=99, is_active=True)
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_user_role, # Encuentra el UserRole
        None            # Pero no encuentra el Role asociado por ID
    ]
    assert UserService.get_user_role_name(mock_db, user_id=1) == "cliente"


def test_get_user_role_name_success(mock_db):
    mock_user_role = UserRole(user_id=1, role_id=2, is_active=True)
    mock_role = Role(id=2, name="administrador")
    
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_user_role,
        mock_role
    ]
    assert UserService.get_user_role_name(
    mock_db, user_id=1) == "administrador"
