import base64
import json
from app.providers.google_provider import GoogleOAuthProvider

def test_decode_jwt_payload():
    header = base64.urlsafe_b64encode(b"header").decode("utf-8")
    payload = base64.urlsafe_b64encode(json.dumps(
        {"sub": "123"}).encode("utf-8")).decode("utf-8")
    sig = base64.urlsafe_b64encode(b"sig").decode("utf-8")
    token = f"{header}.{payload}.{sig}"
    
    decoded = GoogleOAuthProvider._decode_jwt_payload(token)
    assert decoded["sub"] == "123"
    
def test_decode_jwt_payload_invalid():
    assert GoogleOAuthProvider._decode_jwt_payload("invalid") is None
    assert GoogleOAuthProvider._decode_jwt_payload("a.b.c") is None

def test_verify_supabase_token():
    header = base64.urlsafe_b64encode(b"header").decode("utf-8")
    payload = base64.urlsafe_b64encode(json.dumps(
        {"sub": "123", "email": "a@b.com"}).encode("utf-8")).decode("utf-8")
    sig = base64.urlsafe_b64encode(b"sig").decode("utf-8")
    token = f"{header}.{payload}.{sig}"
    
    res = GoogleOAuthProvider.verify_supabase_token(token)
    assert res["sub"] == "123"
    assert res["email"] == "a@b.com"
    assert "user_metadata" in res

def test_verify_supabase_token_invalid():
    assert GoogleOAuthProvider.verify_supabase_token("invalid") is None

def test_extract_user_info():
    payload = {
        "sub": "123",
        "email": "a@b.com",
        "user_metadata": {
            "first_name": "Juan",
            "last_name": "Perez"
        }
    }
    res = GoogleOAuthProvider.extract_user_info(payload)
    assert res["supabase_id"] == "123"
    assert res["first_name"] == "Juan"
    assert res["last_name"] == "Perez"

def test_extract_user_info_full_name():
    payload = {
        "sub": "123",
        "email": "a@b.com",
        "user_metadata": {
            "full_name": "Juan Perez Gomez"
        }
    }
    res = GoogleOAuthProvider.extract_user_info(payload)
    assert res["first_name"] == "Juan"
    assert res["last_name"] == "Perez Gomez"
    
def test_extract_user_info_fallback():
    payload = {
        "sub": "123",
        "email": "a@b.com",
        "given_name": "A",
        "family_name": "B"
    }
    res = GoogleOAuthProvider.extract_user_info(payload)
    assert res["first_name"] == "A"
    assert res["last_name"] == "B"
