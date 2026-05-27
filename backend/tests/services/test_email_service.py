import pytest
from unittest.mock import patch, MagicMock
from app.services.email_service import EmailService

def test_is_enabled():
    with patch("app.services.email_service.settings") as mock_settings:
        mock_settings.BREVO_API_KEY = "key"
        mock_settings.BREVO_EMAIL_FROM = "test@test.com"
        assert EmailService._is_enabled() is True
        
        mock_settings.BREVO_API_KEY = None
        assert EmailService._is_enabled() is False

def test_normalize_recipient():
    assert EmailService._normalize_recipient(
        "test@example.com") == "test@example.com"
    assert EmailService._normalize_recipient(
        "Invalid Email <test@example.com>") == "test@example.com"
    assert EmailService._normalize_recipient("invalid") is None
    assert EmailService._normalize_recipient(None) is None

def test_safe_text():
    assert EmailService._safe_text(" test ") == "test"
    assert EmailService._safe_text(None, "fallback") == "fallback"
    assert EmailService._safe_text(" ", "fallback") == "fallback"

@patch("app.services.email_service.requests.post")
@patch("app.services.email_service.EmailService._is_enabled", return_value=True)
def test_send_message_success(mock_is_enabled, mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_post.return_value = mock_response
    
    res = EmailService._send_message(
    "test@example.com",
    "Subject",
    "text",
     "<html></html>")
    assert res["status"] == "sent"
    mock_post.assert_called_once()

@patch("app.services.email_service.requests.post")
@patch("app.services.email_service.EmailService._is_enabled", return_value=True)
def test_send_message_invalid_recipient(mock_is_enabled, mock_post):
    res = EmailService._send_message(
    "invalid", "Subject", "text", "<html></html>")
    assert res["status"] == "error"
    mock_post.assert_not_called()

@patch("app.services.email_service.EmailService._is_enabled", return_value=False)
def test_send_message_disabled(mock_is_enabled):
    res = EmailService._send_message(
    "test@example.com",
    "Subject",
    "text",
     "<html></html>")
    assert res["status"] == "disabled"

@patch("app.services.email_service.requests.post")
@patch("app.services.email_service.EmailService._is_enabled", return_value=True)
def test_send_message_400_error(mock_is_enabled, mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"message": "bad request"}
    mock_post.return_value = mock_response
    
    res = EmailService._send_message(
    "test@example.com",
    "Subject",
    "text",
     "<html></html>")
    assert res["status"] == "error"

@patch("app.services.email_service.requests.post")
@patch("app.services.email_service.EmailService._is_enabled", return_value=True)
def test_send_message_401_error(mock_is_enabled, mock_post):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_post.return_value = mock_response
    
    res = EmailService._send_message(
    "test@example.com",
    "Subject",
    "text",
     "<html></html>")
    assert res["status"] == "error"
    assert "rechazó la autenticación" in res["error"]

@patch("app.services.email_service.requests.post")
@patch("app.services.email_service.EmailService._is_enabled", return_value=True)
def test_send_message_network_error(mock_is_enabled, mock_post):
    import requests
    mock_post.side_effect = requests.RequestException("Network error")
    
    res = EmailService._send_message(
    "test@example.com",
    "Subject",
    "text",
     "<html></html>")
    assert res["status"] == "error"
    assert "conectar con el proveedor" in res["error"]

@patch("app.services.email_service.EmailService._send_message")
def test_send_welcome_email(mock_send):
    mock_send.return_value = {"status": "sent"}
    res = EmailService.send_welcome_email("test@example.com", "Juan")
    assert res["status"] == "sent"
    mock_send.assert_called_once()

@patch("app.services.email_service.EmailService._send_message")
def test_send_order_created_email(mock_send):
    mock_send.return_value = {"status": "sent"}
    res = EmailService.send_order_created_email(
    "test@example.com", "Juan", 1, "Order", 2, 1000.0)
    assert res["status"] == "sent"
    mock_send.assert_called_once()

@patch("app.services.email_service.EmailService._send_message")
def test_send_order_accepted_email(mock_send):
    mock_send.return_value = {"status": "sent"}
    res = EmailService.send_order_accepted_email(
    "test@example.com", "Juan", 1, "Order", "Company")
    assert res["status"] == "sent"
    mock_send.assert_called_once()

@patch("app.services.email_service.EmailService._send_message")
def test_send_payment_confirmed_email(mock_send):
    mock_send.return_value = {"status": "sent"}
    res = EmailService.send_payment_confirmed_email(
    "test@example.com", "Juan", 1, "Order", 1000.0)
    assert res["status"] == "sent"
    mock_send.assert_called_once()

@patch("app.services.email_service.EmailService._send_message")
def test_send_order_delivered_email(mock_send):
    mock_send.return_value = {"status": "sent"}
    res = EmailService.send_order_delivered_email(
        "test@example.com", "Juan", 1, "Order", 10)
    assert res["status"] == "sent"
    mock_send.assert_called_once()
