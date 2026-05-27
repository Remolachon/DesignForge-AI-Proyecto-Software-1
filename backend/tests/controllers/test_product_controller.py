import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import OperationalError
from app.main import app
from app.security.token_validator import get_current_user

client = TestClient(app)

def _mock_db_user(company_id=1, role="administrador"):
    user = MagicMock()
    user.id = 1
    user.company_id = company_id
    user.supabase_id = "test-supa-id"
    return user


def override_get_current_user():
    user = MagicMock()
    user.id = "test-supa-id"
    return user

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def mock_current_user():
    # Keep fixture for compatibility but it's handled by override
    yield


@pytest.fixture
def mock_get_user_role_name():
    with patch("app.services.user_service.UserService.get_user_role_name") as mock_role:
        mock_role.return_value = "administrador"
        yield mock_role


@pytest.fixture
def mock_db_query():
    with patch("app.database.database.get_db") as mock_get_db:
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        yield mock_db


@patch("app.controllers.product_controller.retry_on_connection_error")
def test_get_products(mock_retry):
    mock_retry.return_value = [{"id": 1, "name": "Producto 1"}]
    with patch("app.controllers.product_controller.ProductService.get_products") as mock_srv:
        mock_srv.return_value = [{"id": 1, "name": "Producto 1"}]
        response = client.get("/products/")
        assert response.status_code == 200
        assert response.json() == [{"id": 1, "name": "Producto 1"}]

def test_get_products_db_error():
    with patch("app.controllers.product_controller.ProductService.get_products") as mock_srv:
        mock_srv.side_effect = OperationalError("stmt", "params", "orig")
        response = client.get("/products/")
        assert response.status_code == 503


@patch("app.controllers.product_controller._get_db_user_with_retry")
def test_get_admin_products(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.product_controller.ProductService.get_admin_products") as mock_srv:
        mock_srv.return_value = [{"id": 1,
    "name": "p",
    "description": "d",
    "basePrice": 1.0,
    "productType": "t",
    "imageUrl": "url",
    "inStock": True,
    "stock": 1,
    "isActive": True,
    "isPublic": True,
    "rating": 1.0,
    "reviews": 1,
    "createdAt": "2024",
     "attributes": []}]
        response = client.get("/products/admin")
        assert response.status_code == 200
        assert response.json()[0]["id"] == 1

@patch("app.controllers.product_controller._get_db_user_with_retry")
def test_get_admin_products_forbidden(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    mock_get_user_role_name.return_value = "cliente"
    
    response = client.get("/products/admin")
    assert response.status_code == 403


@patch("app.controllers.product_controller._get_db_user_with_retry")
def test_get_admin_products_page(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.product_controller.ProductService.get_admin_products_page") as mock_srv:
        mock_srv.return_value = {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
     "totalPages": 1}
        response = client.get("/products/admin/page?page=1&page_size=20")
        assert response.status_code == 200


@patch("app.controllers.product_controller._get_funcionario_user_with_retry")
def test_create_admin_product(mock_get_funcionario_user, mock_current_user):
    mock_get_funcionario_user.return_value = _mock_db_user()
    payload = {
        "name": "New Product",
        "description": "Desc",
        "basePrice": 100,
        "productType": "t",
        "stock": 10
    }
    with patch("app.controllers.product_controller.ProductService.create_admin_product") as mock_srv:
        mock_srv.return_value = {
    "id": 1,
    "name": "New Product",
    "description": "Desc",
    "basePrice": 100,
    "productType": "t",
    "imageUrl": None,
    "inStock": True,
    "stock": 10,
    "isActive": True,
    "isPublic": True,
    "rating": 0,
    "reviews": 0,
    "createdAt": "2024",
     "attributes": []}
        response = client.post("/products/admin", json=payload)
        assert response.status_code == 200
        assert response.json()["id"] == 1

@patch("app.controllers.product_controller._get_funcionario_user_with_retry")
def test_create_admin_product_error(
    mock_get_funcionario_user, mock_current_user):
    mock_get_funcionario_user.return_value = _mock_db_user()
    with patch("app.controllers.product_controller.ProductService.create_admin_product") as mock_srv:
        mock_srv.side_effect = ValueError("Bad input")
        response = client.post(
    "/products/admin",
    json={
        "name": "N",
        "description": "D",
        "basePrice": 1,
        "productType": "t",
         "stock": 10})
        assert response.status_code == 400


@patch("app.controllers.product_controller._get_funcionario_user_with_retry")
def test_update_admin_product(mock_get_funcionario_user, mock_current_user):
    mock_get_funcionario_user.return_value = _mock_db_user()
    payload = {
        "name": "Updated",
        "description": "Desc",
        "basePrice": 100,
        "productType": "t",
        "stock": 10
    }
    with patch("app.controllers.product_controller.ProductService.update_admin_product") as mock_srv:
        mock_srv.return_value = {
    "id": 1,
    "name": "Updated",
    "description": "Desc",
    "basePrice": 100,
    "productType": "t",
    "imageUrl": None,
    "inStock": True,
    "stock": 10,
    "isActive": True,
    "isPublic": True,
    "rating": 0,
    "reviews": 0,
    "createdAt": "2024",
     "attributes": []}
        response = client.put("/products/admin/1", json=payload)
        assert response.status_code == 200
        assert response.json()["name"] == "Updated"


@patch("app.controllers.product_controller._get_funcionario_user_with_retry")
def test_set_product_visibility(mock_get_funcionario_user, mock_current_user):
    mock_get_funcionario_user.return_value = _mock_db_user()
    with patch("app.controllers.product_controller.ProductService.set_product_visibility") as mock_srv:
        mock_srv.return_value = {
    "id": 1,
    "name": "Product",
    "description": "Desc",
    "basePrice": 100,
    "productType": "t",
    "imageUrl": None,
    "inStock": True,
    "stock": 10,
    "isActive": True,
    "isPublic": False,
    "rating": 0,
    "reviews": 0,
    "createdAt": "2024",
     "attributes": []}
        response = client.patch(
    "/products/admin/1/visibility",
    json={
        "is_public": False})
        assert response.status_code == 200
        assert response.json()["isPublic"] is False


@patch("app.controllers.product_controller._get_funcionario_user_with_retry")
def test_logical_delete_product(mock_get_funcionario_user, mock_current_user):
    mock_get_funcionario_user.return_value = _mock_db_user()
    with patch("app.controllers.product_controller.ProductService.logical_delete_product") as mock_srv:
        mock_srv.return_value = None
        response = client.delete("/products/admin/1")
        assert response.status_code == 200
        assert response.json()["message"] == "Producto eliminado"


@patch("app.controllers.product_controller._get_funcionario_user_with_retry")
def test_upload_product_media(mock_get_funcionario_user, mock_current_user):
    mock_get_funcionario_user.return_value = _mock_db_user()
    
    with patch("app.controllers.product_controller.ProductService.upload_product_media") as mock_srv:
        mock_srv.return_value = {
            "id": 1, "storage_path": "p", "media_kind": "image", 
            "media_role": "main", "sort_order": 1, "mime_type": "image/jpeg", "publicUrl": "http://url"
        }
        
        response = client.post(
            "/products/admin/1/media",
            data={
                "company_id": "1",
                "media_kind": "image",
                "media_role": "main",
                "sort_order": "1"
            },
            files={"file": ("test.jpg", b"image data", "image/jpeg")}
        )
        assert response.status_code == 200
        assert response.json()["id"] == 1


def test_get_product_attributes():
    with patch("app.controllers.product_controller.ProductService.get_product_attributes") as mock_srv:
        mock_srv.return_value = [{"code": "color", "label": "Color"}]
        response = client.get("/products/1/attributes")
        assert response.status_code == 200


def test_get_product_shapes():
    with patch("app.controllers.product_controller.ProductService.get_product_shapes") as mock_srv:
        mock_srv.return_value = [{"id": 1, "name": "Shape"}]
        response = client.get("/products/shapes")
        assert response.status_code == 200


def test_get_shape_attributes():
    with patch("app.controllers.product_controller.ProductService.get_shape_attributes") as mock_srv:
        mock_srv.return_value = [{"id": 1,
    "code": "color",
    "label": "Color",
    "input_type": "text",
    "required": True,
     "sort_order": 1}]
        response = client.get("/products/shapes/1/attributes")
        assert response.status_code == 200

def test_get_shape_attributes_not_found():
    with patch("app.controllers.product_controller.ProductService.get_shape_attributes") as mock_srv:
        mock_srv.side_effect = ValueError("Not found")
        response = client.get("/products/shapes/999/attributes")
        assert response.status_code == 404
