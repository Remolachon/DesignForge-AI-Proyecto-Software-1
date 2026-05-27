import pytest
import io
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

@pytest.fixture
def client_no_auth():
    with TestClient(app) as c:
        yield c

def test_generate_preview_endpoint(client_no_auth):
    img = Image.new("RGBA", (10, 10))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    with patch("app.controllers.ai_controller.upload_image_bytes", return_value="http://fake"):
        with patch("app.controllers.ai_controller.call_sd_img2img") as mock_call:
            mock_call.return_value = img
            resp = client_no_auth.post(
                "/generate-preview?style=bordado",
                files={"file": ("test.png", buf, "image/png")}
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["preview_url"] == "http://fake"

def test_generate_preview_endpoint_fallback(client_no_auth):
    img = Image.new("RGBA", (10, 10))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    with patch("app.controllers.ai_controller.upload_image_bytes", return_value="http://fake"):
        # Make HF Space call fail so it falls back
        with patch("app.controllers.ai_controller.call_sd_img2img", side_effect=Exception("HF Failed")):
            with patch("app.controllers.ai_controller.generate_fallback", return_value=img) as mock_fallback:
                resp = client_no_auth.post(
                    "/generate-preview?style=neon_flex",
                    files={"file": ("test.png", buf, "image/png")}
                )
                assert resp.status_code == 200
                data = resp.json()
                assert data["preview_url"] == "http://fake"
                mock_fallback.assert_called_once()

def test_generate_preview_invalid_style(client_no_auth):
    img = Image.new("RGBA", (10, 10))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    
    resp = client_no_auth.post(
        "/generate-preview?style=invalid",
        files={"file": ("test.png", buf, "image/png")}
    )
    assert resp.status_code == 400

@pytest.mark.asyncio
async def test_call_sd_img2img():
    from app.controllers.ai_controller import call_sd_img2img
    img = Image.new("RGB", (10, 10))
    with patch("app.controllers.ai_controller.Client") as mock_client:
        mock_client.return_value.predict.return_value = "fake_path.png"
        with patch("os.path.exists", return_value=True):
            with patch("PIL.Image.open") as mock_open:
                mock_open.return_value.convert.return_value.load = MagicMock()
                mock_open.return_value.convert.return_value = img
                res = await call_sd_img2img(img, "bordado")
                assert res == img

def test_prepare_source_image():
    from app.controllers.ai_controller import prepare_source_image
    img = Image.new("RGBA", (100, 100), (255, 255, 255, 255))
    res = prepare_source_image(img, 512, "bordado", bg_color=(0, 0, 0))
    assert res.size == (512, 512)
    assert res.mode == "RGB"

def test_prepare_source_image_auto_bg():
    from app.controllers.ai_controller import prepare_source_image
    img = Image.new("RGBA", (100, 100), (100, 100, 100, 255))
    res = prepare_source_image(img, 512, "bordado")
    assert res.size == (512, 512)
    assert res.mode == "RGB"

def test_generate_fallback():
    from app.controllers.ai_controller import generate_fallback
    img = Image.new("RGBA", (100, 100))
    res1 = generate_fallback(img, "bordado")
    assert isinstance(res1, Image.Image)
    res2 = generate_fallback(img, "neon_flex")
    assert isinstance(res2, Image.Image)
    res3 = generate_fallback(img, "acrilico")
    assert isinstance(res3, Image.Image)

def test_upload_image_bytes():
    from app.controllers.ai_controller import upload_image_bytes
    with patch("app.controllers.ai_controller.supabase_admin") as mock_supa:
        mock_supa.storage.from_.return_value.create_signed_url.return_value = {
            "signedURL": "http://fake"}
        url = upload_image_bytes(b"123", "path")
        assert url == "http://fake"

def test_pil_to_png_bytes():
    from app.controllers.ai_controller import pil_to_png_bytes
    img = Image.new("RGB", (10, 10))
    res = pil_to_png_bytes(img)
    assert isinstance(res, bytes)
