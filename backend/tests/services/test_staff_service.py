import pytest
import app.main  # Forzar inicialización de mappers de SQLAlchemy
from unittest.mock import MagicMock, patch
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

# Ajusta el import según la ubicación real de tu archivo staff_service.py
from app.services.staff_service import (
    get_company_staff,
    _get_funcionario_role,
    _get_user_in_company,
    assign_funcionario_role,
    revoke_funcionario_role,
    invite_funcionario,
    remove_funcionario_from_company,
    ROLE_FUNCIONARIO_NAME
)
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.models.company import Company
from app.models.notification import Notification

@pytest.fixture
def mock_db():
    return MagicMock()

# --- Tests para _get_funcionario_role ---

def test_get_funcionario_role_success(mock_db):
    mock_role = Role(id=2, name=ROLE_FUNCIONARIO_NAME)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_role
    
    role = _get_funcionario_role(mock_db)
    assert role.name == ROLE_FUNCIONARIO_NAME

def test_get_funcionario_role_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    with pytest.raises(HTTPException) as exc_info:
        _get_funcionario_role(mock_db)
    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

# --- Tests para _get_user_in_company ---

def test_get_user_in_company_success(mock_db):
    mock_user = User(id=1, company_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user
    
    user = _get_user_in_company(mock_db, target_user_id=1, company_id=10)
    assert user.id == 1

def test_get_user_in_company_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    with pytest.raises(HTTPException) as exc_info:
        _get_user_in_company(mock_db, target_user_id=1, company_id=10)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

def test_get_user_in_company_forbidden(mock_db):
    mock_user = User(id=1, company_id=99) # Pertenece a otra empresa
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user
    
    with pytest.raises(HTTPException) as exc_info:
        _get_user_in_company(mock_db, target_user_id=1, company_id=10)
    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN

# --- Tests para assign_funcionario_role ---

@patch("app.services.staff_service._get_user_in_company")
@patch("app.services.staff_service._get_funcionario_role")
def test_assign_funcionario_role_new(mock_get_role, mock_get_user, mock_db):
    mock_get_user.return_value = User(id=1, company_id=10)
    mock_get_role.return_value = Role(id=2, name=ROLE_FUNCIONARIO_NAME)
    
    # Simular que no existe el rol asignado previamente y que la empresa existe
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        None,  # Para existing UserRole
        Company(id=10, name="LukArt Inc") # Para la compañía
    ]
    
    result = assign_funcionario_role(mock_db, target_user_id=1, company_id=10)
    
    assert result["message"] == "Rol 'funcionario' asignado correctamente"
    assert result["user_id"] == 1
    mock_db.add.assert_called() # Verifica que se añadió UserRole y Notificación
    mock_db.commit.assert_called()

@patch("app.services.staff_service._get_user_in_company")
@patch("app.services.staff_service._get_funcionario_role")
def test_assign_funcionario_role_integrity_error(mock_get_role, mock_get_user, mock_db):
    mock_get_user.return_value = User(id=1, company_id=10)
    mock_get_role.return_value = Role(id=2, name=ROLE_FUNCIONARIO_NAME)
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    # Forzar un error de base de datos al hacer commit
    mock_db.commit.side_effect = IntegrityError("Error", {}, BaseException())
    
    with pytest.raises(HTTPException) as exc_info:
        assign_funcionario_role(mock_db, target_user_id=1, company_id=10)
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    mock_db.rollback.assert_called_once()

# --- Tests para revoke_funcionario_role ---

@patch("app.services.staff_service._get_user_in_company")
@patch("app.services.staff_service._get_funcionario_role")
def test_revoke_funcionario_role_success(mock_get_role, mock_get_user, mock_db):
    mock_get_user.return_value = User(id=1, company_id=10)
    mock_get_role.return_value = Role(id=2, name=ROLE_FUNCIONARIO_NAME)
    
    mock_user_role = MagicMock()
    mock_user_role.is_active = True
    
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_user_role, # Para UserRole
        Company(id=10, name="LukArt Inc") # Para la compañía
    ]
    
    result = revoke_funcionario_role(mock_db, target_user_id=1, company_id=10)
    
    assert result["message"] == "Rol 'funcionario' revocado correctamente"
    assert mock_user_role.is_active == False
    mock_db.commit.assert_called()

# --- Tests para invite_funcionario ---

@patch("app.services.user_service.UserService.get_user_role_name")
@patch("app.services.user_service.UserService.promote_user_to_funcionario")
def test_invite_funcionario_success(mock_promote, mock_get_role_name, mock_db):
    mock_user = User(id=1, email="test@lukart.com", company_id=None)
    mock_get_role_name.return_value = "cliente"
    
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_user, # Para el User
        Company(id=10, name="LukArt Inc") # Para la compañía
    ]
    
    result = invite_funcionario(mock_db, email="test@lukart.com", company_id=10)
    
    assert result["message"] == "Usuario invitado correctamente"
    mock_promote.assert_called_once_with(mock_db, 1, 10, commit=True)

def test_invite_funcionario_already_in_same_company(mock_db):
    mock_user = User(id=1, email="test@lukart.com", company_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user
    
    with pytest.raises(HTTPException) as exc_info:
        invite_funcionario(mock_db, email="test@lukart.com", company_id=10)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

# --- Tests para remove_funcionario_from_company ---

@patch("app.services.staff_service._get_user_in_company")
@patch("app.services.user_service.UserService.set_user_company")
@patch("app.services.user_service.UserService.set_user_role")
def test_remove_funcionario_from_company(mock_set_role, mock_set_company, mock_get_user, mock_db):
    mock_get_user.return_value = User(id=1, email="test@lukart.com", company_id=10)
    mock_db.query.return_value.filter.return_value.first.return_value = Company(id=10, name="LukArt Inc")
    
    result = remove_funcionario_from_company(mock_db, target_user_id=1, company_id=10)
    
    assert result["message"] == "Usuario removido de la empresa correctamente"
    mock_set_company.assert_called_once_with(mock_db, 1, None, commit=False)
    mock_set_role.assert_called_once_with(mock_db, 1, "cliente", commit=False)
    mock_db.commit.assert_called()

# --- Tests para get_company_staff ---

def test_get_company_staff(mock_db):
    # Simular una fila devuelta por el join en SQLAlchemy
    mock_row = MagicMock()
    mock_row.id = 2
    mock_row.first_name = "Juan"
    mock_row.last_name = "Perez"
    mock_row.email = "juan@lukart.com"
    mock_row.is_active = True
    mock_row.role_active = True
    mock_row.assigned_at = None
    
    # Configurar el mock encadenado
    mock_db.query.return_value.join.return_value.join.return_value.filter.return_value.all.return_value = [mock_row]
    
    result = get_company_staff(mock_db, company_id=10, current_user_id=1)
    
    assert len(result) == 1
    assert result[0]["first_name"] == "Juan"
    assert result[0]["email"] == "juan@lukart.com"
