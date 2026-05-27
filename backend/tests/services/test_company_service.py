import pytest
import app.main  # Forzar inicialización de mappers de SQLAlchemy
from unittest.mock import MagicMock, patch
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.services.company_service import CompanyService
from app.models.company import Company
from app.models.user import User
from app.schemas.company_schema import CompanyCreateRequest

@pytest.fixture
def mock_db():
    return MagicMock()

def test_normalize_text():
    assert CompanyService._normalize_text(None) is None
    assert CompanyService._normalize_text("  ") is None
    assert CompanyService._normalize_text(" test ") == "test"

def test_normalize_required():
    assert CompanyService._normalize_required(" test ") == "test"
    with pytest.raises(HTTPException) as exc_info:
        CompanyService._normalize_required("   ")
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

@patch("app.services.user_service.UserService.set_user_company")
@patch("app.services.user_service.UserService.set_user_role")
def test_create_company_success(mock_set_role, mock_set_company, mock_db):
    mock_user = User(id=1, email="test@lukart.com")
    payload = CompanyCreateRequest(nit="123", name="Test Inc")
    
    # Existing NIT/Email not found
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        None, None]
    
    company = CompanyService.create_company(mock_db, payload, mock_user)
    
    assert company.nit == "123"
    assert company.name == "Test Inc"
    assert company.email == "test@lukart.com"
    assert company.status == "PENDING"
    assert not company.is_active
    
    mock_db.add.assert_called_once()
    assert mock_db.commit.call_count == 2
    mock_set_company.assert_called_once()
    mock_set_role.assert_called_once_with(
    mock_db, 1, "funcionario_adm", commit=False)

def test_create_company_existing_nit(mock_db):
    mock_user = User(id=1, email="test@lukart.com")
    payload = CompanyCreateRequest(nit="123", name="Test Inc")
    
    mock_db.query.return_value.filter.return_value.first.return_value = Company(
        id=10)
    
    with pytest.raises(HTTPException) as exc_info:
        CompanyService.create_company(mock_db, payload, mock_user)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert exc_info.value.detail == "El NIT ya existe"

def test_create_company_existing_email(mock_db):
    mock_user = User(id=1, email="test@lukart.com")
    payload = CompanyCreateRequest(nit="123", name="Test Inc")
    
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        None, Company(id=10)]
    
    with pytest.raises(HTTPException) as exc_info:
        CompanyService.create_company(mock_db, payload, mock_user)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert exc_info.value.detail == "El correo ya existe"

@patch("app.services.user_service.UserService.set_user_company")
@patch("app.services.user_service.UserService.set_user_role")
def test_create_company_integrity_error(
    mock_set_role, mock_set_company, mock_db):
    mock_user = User(id=1, email="test@lukart.com")
    payload = CompanyCreateRequest(nit="123", name="Test Inc")
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        None, None]
    mock_db.commit.side_effect = IntegrityError("error", {}, BaseException())
    
    with pytest.raises(HTTPException) as exc_info:
        CompanyService.create_company(mock_db, payload, mock_user)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert exc_info.value.detail == "No se pudo crear la empresa"
    mock_db.rollback.assert_called_once()

@patch("app.services.user_service.UserService.set_user_company")
@patch("app.services.user_service.UserService.set_user_role")
def test_update_company_status_approve(
    mock_set_role, mock_set_company, mock_db):
    mock_company = Company(
    id=10,
    status="PENDING",
    is_active=False,
     created_by_user_id=1)
    mock_user = User(id=1)
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_company, mock_user]
    
    company = CompanyService.update_company_status(mock_db, 10, "APPROVED")
    
    assert company.status == "APPROVED"
    assert company.is_active is True
    mock_db.commit.assert_called_once()
    mock_set_company.assert_called_once()
    mock_set_role.assert_called_once_with(
    mock_db, user_id=1, role_name="funcionario_adm", commit=False)

def test_update_company_status_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        CompanyService.update_company_status(mock_db, 10, "APPROVED")
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

def test_update_company_status_reject(mock_db):
    mock_company = Company(
    id=10,
    status="PENDING",
    is_active=False,
     created_by_user_id=1)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_company
    
    company = CompanyService.update_company_status(mock_db, 10, "REJECTED")
    
    assert company.status == "REJECTED"
    assert company.is_active is False
    mock_db.commit.assert_called_once()

@patch("app.services.user_service.UserService.set_user_company")
@patch("app.services.user_service.UserService.set_user_role")
def test_delete_company_success(mock_set_role, mock_set_company, mock_db):
    mock_company = Company(
    id=10,
    status="APPROVED",
    is_active=True,
     created_by_user_id=1)
    mock_user = User(id=1)
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_company, mock_user]
    
    company = CompanyService.delete_company(mock_db, 10)
    
    assert company.is_active is False
    mock_set_company.assert_called_once_with(mock_db, 1, None, commit=False)
    mock_set_role.assert_called_once_with(mock_db, 1, "cliente", commit=False)

def test_delete_company_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc_info:
        CompanyService.delete_company(mock_db, 10)
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND

def test_get_admin_companies(mock_db):
    mock_company = Company(
        id=10, 
        status="PENDING", 
        start_date=datetime.utcnow(),
        nit="123",
        name="Test",
        email="test@test.com",
        created_by_user_id=1
    )
    # Simulation of join
    mock_db.query.return_value.join.return_value.order_by.return_value.filter.return_value.all.return_value = [
        (mock_company, "Juan", "Perez")
    ]
    
    res = CompanyService.get_admin_companies(mock_db, filter_status="pending")
    assert len(res) == 1
    assert res[0].created_by_user_name == "Juan Perez"

def test_get_admin_companies_other_filters(mock_db):
    mock_company = Company(
    id=10,
    nit="123",
    name="Test",
    email="t@t.com",
    created_by_user_id=1,
    status="REJECTED",
     start_date=datetime.utcnow())
    mock_db.query.return_value.join.return_value.order_by.return_value.filter.return_value.all.return_value = [
        (mock_company, "Juan", "Perez")]
    
    res1 = CompanyService.get_admin_companies(
        mock_db, filter_status="rejected")
    assert len(res1) == 1
    res2 = CompanyService.get_admin_companies(mock_db, filter_status="active")
    assert len(res2) == 1
    res3 = CompanyService.get_admin_companies(
        mock_db, filter_status="inactive")
    assert len(res3) == 1
    
    # test branch that skips filter setup
    mock_db.query.return_value.join.return_value.order_by.return_value.all.return_value = []
    res4 = CompanyService.get_admin_companies(mock_db, filter_status="all")
    assert len(res4) == 0

def test_update_company_status_creator_not_found(mock_db):
    mock_company = Company(
    id=10,
    status="PENDING",
    is_active=False,
     created_by_user_id=1)
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_company, None]
    with pytest.raises(HTTPException) as exc_info:
        CompanyService.update_company_status(mock_db, 10, "APPROVED")
    assert exc_info.value.status_code == 404

def test_delete_company_creator_not_found(mock_db):
    mock_company = Company(
    id=10,
    status="APPROVED",
    is_active=True,
     created_by_user_id=1)
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        mock_company, None]
    with pytest.raises(HTTPException) as exc_info:
        CompanyService.delete_company(mock_db, 10)
    assert exc_info.value.status_code == 404

def test_get_admin_company_counts(mock_db):
    mock_db.query.return_value.count.side_effect = [100]
    mock_db.query.return_value.filter.return_value.count.side_effect = [
        10, 5, 80, 5]
    
    res = CompanyService.get_admin_company_counts(mock_db)
    assert res["total"] == 100
    assert res["pending"] == 10
    assert res["rejected"] == 5
    assert res["active"] == 80
    assert res["inactive"] == 5
