import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import OperationalError
from app.main import app
from app.models.order import Order
from app.security.token_validator import get_current_user

client = TestClient(app)

def _mock_db_user(company_id=1, role="administrador"):
    user = MagicMock()
    user.id = 1
    user.company_id = company_id
    user.supabase_id = "test-supa-id"
    user.email = "test@test.com"
    user.first_name = "Test"
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
        mock_role.return_value = "funcionario"
        yield mock_role


from app.database.database import get_db

@pytest.fixture
def mock_db_query():
    db_mock = MagicMock()
    app.dependency_overrides[get_db] = lambda: db_mock
    yield db_mock
    app.dependency_overrides.pop(get_db, None)


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_create_order(mock_get_db_user, mock_current_user):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.create_order") as mock_srv:
        order = MagicMock()
        order.id = 1
        order.total_amount = 100.0
        mock_srv.return_value = order
        
        payload = {
            "product_type": "custom",
            "shape_id": 1,
            "image_url": "http://img.com/object/sign/path",
            "quantity": 1,
            "attributes": {"color": {"label": "Color", "value": "rojo"}}
        }
        
        response = client.post("/orders/", json=payload)
        assert response.status_code == 200
        assert response.json()["order_id"] == 1


@patch("app.controllers.order_controller._get_db_user_with_retry")
@patch("app.controllers.order_controller._send_order_created_email")
def test_create_marketplace_order(
    mock_email, mock_get_db_user, mock_current_user):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.create_marketplace_order") as mock_create, \
         patch("app.controllers.order_controller.OrderService.generate_payment_url") as mock_pay_url:
        
        order = MagicMock()
        order.id = 1
        order.total_amount = 100.0
        mock_create.return_value = order
        mock_pay_url.return_value = {
    "payment_url": "http://pay.com",
     "status": "success"}
        
        payload = {
            "product_id": 1,
            "quantity": 1,
            "attributes": {"color": "rojo"}
        }
        
        response = client.post("/orders/marketplace", json=payload)
        assert response.status_code == 200
        assert response.json()["order_id"] == 1


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_get_dashboard_data(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    mock_get_user_role_name.return_value = "cliente"
    
    with patch("app.controllers.order_controller.OrderService.get_dashboard_data") as mock_srv:
        mock_srv.return_value = {
    "orders": [],
    "stats": {
        "total": 0,
        "pending_payment": 0,
        "design": 0,
        "production": 0,
        "ready": 0,
         "active": 0}}
        
        response = client.get(
    "/orders/dashboard",
    headers={
        "X-Dashboard-Role": "cliente"})
        assert response.status_code == 200


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_get_my_orders(mock_get_db_user, mock_current_user):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.get_user_orders") as mock_srv:
        mock_srv.return_value = []
        response = client.get("/orders/my-orders")
        assert response.status_code == 200


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_get_my_orders_page(mock_get_db_user, mock_current_user):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.get_user_orders_page") as mock_srv:
        mock_srv.return_value = {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
     "totalPages": 1}
        response = client.get("/orders/my-orders/page?page=1&page_size=10")
        assert response.status_code == 200


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_get_funcionario_orders_page(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.get_funcionario_orders_page") as mock_srv:
        mock_srv.return_value = {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
     "totalPages": 1}
        response = client.get(
            "/orders/funcionario-orders/page?page=1&page_size=10")
        assert response.status_code == 200


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_get_pending_custom_orders_page(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.get_pending_custom_orders_page") as mock_srv:
        mock_srv.return_value = {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
     "totalPages": 1}
        response = client.get(
            "/orders/pending-custom/page?page=1&page_size=10")
        assert response.status_code == 200


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_accept_pending_custom_order(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.accept_pending_custom_order") as mock_srv:
        mock_srv.return_value = {
    "id": "1",
    "title": "t",
    "status": "s",
    "price": 1.0,
    "deliveryDate": "d",
    "createdAt": "c",
    "image": {
        "bucket": "b",
        "path": "p"},
         "quantity": 1}
        response = client.patch("/orders/1/accept")
        assert response.status_code == 200


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_update_order_status(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.update_order_status") as mock_srv:
        mock_srv.return_value = {
    "id": "1",
    "title": "t",
    "status": "s",
    "price": 1.0,
    "deliveryDate": "d",
    "createdAt": "c",
    "image": {
        "bucket": "b",
        "path": "p"},
         "quantity": 1}
        response = client.patch(
    "/orders/1/status",
    json={
        "status": "Entregado"})
        assert response.status_code == 200


@patch("app.controllers.order_controller._get_db_user_with_retry")
def test_get_order_detail(
    mock_get_db_user, mock_current_user, mock_get_user_role_name):
    mock_get_db_user.return_value = _mock_db_user()
    
    with patch("app.controllers.order_controller.OrderService.get_order_detail") as mock_srv:
        mock_srv.return_value = {
    "id": "1",
    "title": "Pedido",
    "status": "En diseño",
    "price": 100.0,
    "deliveryDate": "2024",
    "createdAt": "2024",
    "image": {
        "bucket": "b",
        "path": "p"},
        "media": [],
        "quantity": 1,
         "attributes": []}
        response = client.get("/orders/1")
        assert response.status_code == 200


def test_get_payment_url(mock_db_query, mock_current_user):
    db_mock = mock_db_query
    user_mock = _mock_db_user()
    
    order_mock = MagicMock()
    order_mock.user_id = 1
    
    db_mock.query.return_value.filter.return_value.first.side_effect = [
        user_mock, order_mock]
    
    with patch("app.controllers.order_controller.OrderService.generate_payment_url") as mock_srv:
        mock_srv.return_value = {"status": "success", "payment_url": "http"}
        response = client.post("/orders/1/payment-url")
        assert response.status_code == 200


def test_get_payment_status(
    mock_db_query, mock_current_user, mock_get_user_role_name):
    db_mock = mock_db_query
    user_mock = _mock_db_user()
    
    order_mock = MagicMock()
    order_mock.user_id = 1
    
    db_mock.query.return_value.filter.return_value.first.side_effect = [
        user_mock, order_mock]
    
    with patch("app.controllers.order_controller.OrderService.get_order_payment_status") as mock_srv:
        mock_srv.return_value = {"status": "approved"}
        response = client.get("/orders/1/payment-status")
        assert response.status_code == 200


def test_payu_webhook():
    with patch("app.controllers.order_controller.OrderService.process_payu_webhook") as mock_srv:
        mock_srv.return_value = {"status": "success"}
        response = client.post("/orders/payu-webhook", json={"test": "data"})
        assert response.status_code == 200


def test_payu_response_sync():
    with patch("app.controllers.order_controller.OrderService.process_payu_webhook") as mock_srv:
        mock_srv.return_value = {"status": "success"}
        response = client.post("/orders/payu-response", json={"test": "data"})
        assert response.status_code == 200
