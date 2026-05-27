from app.providers.payu_provider import PayUProvider

def test_generate_signature():
    provider = PayUProvider()
    sig = provider._generate_signature("merch", "ref", "100.00", "COP", "key")
    # MD5 of "key~merch~ref~100.00~COP"
    import hashlib
    expected = hashlib.md5(b"key~merch~ref~100.00~COP").hexdigest()
    assert sig == expected

def test_generate_payment_signature():
    provider = PayUProvider()
    sig = provider._generate_payment_signature(
    "key", "merch", "txn", "4", "1", "ref", "100.00", "COP")
    import hashlib
    expected = hashlib.md5(b"key~merch~txn~4~1~ref~100.00~COP").hexdigest()
    assert sig == expected

def test_generate_payment_url():
    provider = PayUProvider()
    res = provider.generate_payment_url(
    1, "test@test.com", 119.0, "Juan", 19.0, 100.0)
    assert res["status"] == "url_generated"
    assert "payment_url" in res
    assert "payment_payload" in res

def test_generate_payment_url_fallback_taxes():
    provider = PayUProvider()
    res = provider.generate_payment_url(1, "test@test.com", 119.0, "Juan")
    assert res["status"] == "url_generated"
    assert res["payment_payload"]["tax"] == "19.00"

def test_generate_payment_url_error():
    provider = PayUProvider()
    res = provider.generate_payment_url(1, "test@test.com", -10, "Juan")
    assert res["status"] == "error"
    assert "error" in res

def test_validate_webhook_signature():
    provider = PayUProvider()
    provider.api_key = "key"
    import hashlib
    sig = hashlib.md5(b"key~merch~txn~4~1~ref~100.00~COP").hexdigest()
    
    assert provider.validate_webhook_signature(
    sig, "merch", "txn", "4", "1", "ref", "100.00", "COP") is True
    assert provider.validate_webhook_signature(
    "invalid", "merch", "txn", "4", "1", "ref", "100.00", "COP") is False

def test_parse_webhook_data():
    provider = PayUProvider()
    data = {"transactionId": "123", "referenceCode": "ref", "extra1": "order1"}
    parsed = provider.parse_webhook_data(data)
    assert parsed["transaction_id"] == "123"
    assert parsed["reference_code"] == "ref"
    assert parsed["order_id"] == "order1"

def test_get_payment_status():
    assert PayUProvider.get_payment_status("1") == "pending"
    assert PayUProvider.get_payment_status("2") == "approved"
    assert PayUProvider.get_payment_status("99") == "unknown"

def test_is_payment_approved():
    assert PayUProvider.is_payment_approved("APPROVED", "2") is True
    assert PayUProvider.is_payment_approved("DECLINED", "3") is False
    assert PayUProvider.is_payment_approved("00", "2") is True
    assert PayUProvider.is_payment_approved("", "4") is True
