"""
Tests for order_service.py — focuses on static helper methods and utility
functions that can be tested without a real database connection.
"""
import pytest
import app.main  # Initialize SQLAlchemy mappers
from unittest.mock import MagicMock, patch
from datetime import datetime

from app.services.order_service import OrderService
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.file_assets import FileAsset
from app.models.productionStage import ProductionStage
from app.models.inventory import Inventory
from app.models.transaction import Transaction


@pytest.fixture
def mock_db():
    return MagicMock()


# ── _now_local ───────────────────────────────────────────────────────────────

def test_now_local():
    result = OrderService._now_local()
    assert isinstance(result, datetime)


# ── _calculate_amounts_with_vat ──────────────────────────────────────────────

def test_calculate_amounts_with_vat_basic():
    subtotal, tax, total = OrderService._calculate_amounts_with_vat(100.0)
    assert subtotal == 100.0
    assert tax == round(100.0 * 0.19, 2)
    assert total == round(100.0 * 1.19, 2)


def test_calculate_amounts_with_vat_zero():
    subtotal, tax, total = OrderService._calculate_amounts_with_vat(0)
    assert subtotal == 0.0
    assert tax == 0.0
    assert total == 0.0


def test_calculate_amounts_with_vat_negative_raises():
    with pytest.raises(ValueError, match="negativo"):
        OrderService._calculate_amounts_with_vat(-50.0)


# ── _normalize_status ────────────────────────────────────────────────────────

def test_normalize_status_empty():
    assert OrderService._normalize_status(None) == ""
    assert OrderService._normalize_status("") == ""


def test_normalize_status_strips_and_lowercases():
    assert OrderService._normalize_status("  En Diseño  ") == "en diseño"


# ── _canonical_status ────────────────────────────────────────────────────────

def test_canonical_status_pendiente():
    assert OrderService._canonical_status("pendiente") == "Pendiente"


def test_canonical_status_pendiente_de_pago():
    assert OrderService._canonical_status(
        "pendiente de pago") == "Pendiente de pago"
    assert OrderService._canonical_status(
        "pendiente_pago") == "Pendiente de pago"
    assert OrderService._canonical_status(
        "pending payment") == "Pendiente de pago"


def test_canonical_status_en_diseno():
    assert OrderService._canonical_status("en diseño") == "En diseño"


def test_canonical_status_en_produccion():
    assert OrderService._canonical_status("en produccion") == "En producción"
    assert OrderService._canonical_status("en producción") == "En producción"


def test_canonical_status_listo():
    assert OrderService._canonical_status(
        "listo para entregar") == "Listo para entregar"


def test_canonical_status_entregado():
    assert OrderService._canonical_status("entregado") == "Entregado"


def test_canonical_status_pago_rechazado():
    assert OrderService._canonical_status(
        "pago rechazado") == "Pendiente de pago"
    assert OrderService._canonical_status("declined") == "Pendiente de pago"


def test_canonical_status_fallback():
    assert OrderService._canonical_status("unknown_state") == "unknown_state"
    assert OrderService._canonical_status(None) == "En diseño"
    assert OrderService._canonical_status("") == "En diseño"


# ── _status_candidates ───────────────────────────────────────────────────────

def test_status_candidates():
    candidates = OrderService._status_candidates("entregado")
    assert "Entregado" in candidates


# ── _sort_assets ─────────────────────────────────────────────────────────────

def test_sort_assets_main_first():
    a1 = MagicMock(spec=FileAsset)
    a1.media_role = "gallery"
    a1.sort_order = 1
    a1.id = 2

    a2 = MagicMock(spec=FileAsset)
    a2.media_role = "main"
    a2.sort_order = 2
    a2.id = 1

    sorted_assets = OrderService._sort_assets([a1, a2])
    assert sorted_assets[0].media_role == "main"


def test_sort_assets_none_sort_order():
    a1 = MagicMock(spec=FileAsset)
    a1.media_role = "gallery"
    a1.sort_order = None
    a1.id = 5

    sorted_assets = OrderService._sort_assets([a1])
    assert len(sorted_assets) == 1


# ── _serialize_media_asset ───────────────────────────────────────────────────

def test_serialize_media_asset():
    asset = MagicMock(spec=FileAsset)
    asset.bucket_name = "products"
    asset.storage_path = "path/to/img.jpg"
    asset.media_kind = "image"
    asset.media_role = "main"
    asset.mime_type = "image/jpeg"
    asset.sort_order = 1

    result = OrderService._serialize_media_asset(asset)
    assert result["bucket"] == "products"
    assert result["path"] == "path/to/img.jpg"
    assert result["mediaRole"] == "main"


# ── _is_video_asset ──────────────────────────────────────────────────────────

def test_is_video_asset_by_kind():
    asset = MagicMock(spec=FileAsset)
    asset.media_kind = "video"
    asset.mime_type = "video/mp4"
    assert OrderService._is_video_asset(asset) is True


def test_is_video_asset_by_mime():
    asset = MagicMock(spec=FileAsset)
    asset.media_kind = "image"
    asset.mime_type = "video/webm"
    assert OrderService._is_video_asset(asset) is True


def test_is_not_video_asset():
    asset = MagicMock(spec=FileAsset)
    asset.media_kind = "image"
    asset.mime_type = "image/jpeg"
    assert OrderService._is_video_asset(asset) is False


# ── _order_asset_media_role ──────────────────────────────────────────────────

def test_order_asset_media_role_from_role():
    asset = MagicMock(spec=FileAsset)
    asset.media_role = "main"
    asset.file_type = None
    assert OrderService._order_asset_media_role(asset) == "main"


def test_order_asset_media_role_product_main():
    asset = MagicMock(spec=FileAsset)
    asset.media_role = ""
    asset.file_type = "product_main"
    assert OrderService._order_asset_media_role(asset) == "main"


def test_order_asset_media_role_product_gallery():
    asset = MagicMock(spec=FileAsset)
    asset.media_role = ""
    asset.file_type = "product_gallery"
    assert OrderService._order_asset_media_role(asset) == "gallery"


def test_order_asset_media_role_fallback():
    asset = MagicMock(spec=FileAsset)
    asset.media_role = ""
    asset.file_type = "other"
    assert OrderService._order_asset_media_role(asset) == "attachment"


# ── _serialize_order_attributes ──────────────────────────────────────────────

def test_serialize_order_attributes_none_item():
    result = OrderService._serialize_order_attributes(None)
    assert result == []


def test_serialize_order_attributes_with_attrs():
    item = MagicMock(spec=OrderItem)
    attr1 = MagicMock()
    attr1.attribute_code = "color"
    attr1.attribute_label = "Color"
    attr1.value = "Rojo"

    attr2 = MagicMock()
    attr2.attribute_code = ""
    attr2.attribute_label = ""
    attr2.value = "ignored"

    item.attributes = [attr1, attr2]
    result = OrderService._serialize_order_attributes(item)
    assert len(result) == 1
    assert result[0]["code"] == "color"
    assert result[0]["value"] == "Rojo"


def test_serialize_order_attributes_code_fallback_to_label():
    item = MagicMock(spec=OrderItem)
    attr = MagicMock()
    attr.attribute_code = ""
    attr.attribute_label = "Tamaño"
    attr.value = "L"
    item.attributes = [attr]

    result = OrderService._serialize_order_attributes(item)
    assert result[0]["code"] == "Tamaño"
    assert result[0]["label"] == "Tamaño"


# ── _safe_signed_url ─────────────────────────────────────────────────────────

def test_safe_signed_url_missing_params():
    assert OrderService._safe_signed_url(None, "path") is None
    assert OrderService._safe_signed_url("bucket", None) is None
    assert OrderService._safe_signed_url(None, None) is None


@patch("app.services.order_service.supabase_admin")
def test_safe_signed_url_success(mock_supabase):
    mock_supabase.storage.from_.return_value.create_signed_url.return_value = {
        "signedURL": "https://signed.url/image.jpg"
    }
    result = OrderService._safe_signed_url("bucket", "path/img.jpg")
    assert result == "https://signed.url/image.jpg"


@patch("app.services.order_service.supabase_admin")
def test_safe_signed_url_exception_returns_none(mock_supabase):
    mock_supabase.storage.from_.return_value.create_signed_url.side_effect = Exception(
        "error")
    result = OrderService._safe_signed_url("bucket", "path/img.jpg")
    assert result is None


# ── _ensure_stage ────────────────────────────────────────────────────────────

def test_ensure_stage_existing(mock_db):
    stage = MagicMock(spec=ProductionStage)
    stage.id = 1
    stage.name = "En diseño"
    mock_db.query.return_value.filter.return_value.first.return_value = stage

    result = OrderService._ensure_stage(mock_db, "En diseño")
    assert result.name == "En diseño"
    mock_db.add.assert_not_called()


def test_ensure_stage_creates_new(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = OrderService._ensure_stage(mock_db, "Nuevo Estado")
    mock_db.add.assert_called_once()
    mock_db.flush.assert_called_once()
    assert result.name == "Nuevo Estado"


# ── _resolve_target_stage ────────────────────────────────────────────────────

def test_resolve_target_stage_found(mock_db):
    stage = MagicMock(spec=ProductionStage)
    stage.name = "Entregado"
    mock_db.query.return_value.all.return_value = [stage]

    result = OrderService._resolve_target_stage(mock_db, "entregado")
    assert result.name == "Entregado"


def test_resolve_target_stage_not_found(mock_db):
    mock_db.query.return_value.all.return_value = []
    result = OrderService._resolve_target_stage(mock_db, "unknown")
    assert result is None


# ── _get_inventory ───────────────────────────────────────────────────────────

def test_get_inventory(mock_db):
    inv = MagicMock(spec=Inventory)
    inv.product_id = 1
    inv.quantity = 10
    mock_db.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = inv

    result = OrderService._get_inventory(mock_db, 1)
    assert result.quantity == 10


def test_get_inventory_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = None
    result = OrderService._get_inventory(mock_db, 99)
    assert result is None


# ── _reserve_inventory ───────────────────────────────────────────────────────

def test_reserve_inventory_success(mock_db):
    inv = MagicMock(spec=Inventory)
    inv.quantity = 10
    mock_db.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = inv

    OrderService._reserve_inventory(mock_db, 1, 3)
    assert inv.quantity == 7


def test_reserve_inventory_no_stock_raises(mock_db):
    mock_db.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = None

    with pytest.raises(ValueError, match="stock"):
        OrderService._reserve_inventory(mock_db, 1, 1)


def test_reserve_inventory_insufficient_stock_raises(mock_db):
    inv = MagicMock(spec=Inventory)
    inv.quantity = 2
    mock_db.query.return_value.filter.return_value.with_for_update.return_value.first.return_value = inv

    with pytest.raises(ValueError, match="stock"):
        OrderService._reserve_inventory(mock_db, 1, 5)


# ── _restore_inventory ───────────────────────────────────────────────────────

def test_restore_inventory_existing(mock_db):
    inv = MagicMock(spec=Inventory)
    inv.quantity = 5
    mock_db.query.return_value.filter.return_value.first.return_value = inv

    OrderService._restore_inventory(mock_db, 1, 3)
    assert inv.quantity == 8


def test_restore_inventory_creates_new(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    OrderService._restore_inventory(mock_db, 1, 3)
    mock_db.add.assert_called_once()


# ── _create_transaction ──────────────────────────────────────────────────────

def test_create_transaction(mock_db):
    tx = OrderService._create_transaction(
    mock_db, order_id=1, user_id=2, amount=1000.0)

    mock_db.add.assert_called_once()
    mock_db.flush.assert_called_once()
    assert tx.order_id == 1
    assert tx.user_id == 2
    assert tx.amount == 1000.0
    assert tx.status == "pending"


# ── _update_transaction_reference ───────────────────────────────────────────

def test_update_transaction_reference(mock_db):
    tx = MagicMock(spec=Transaction)
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    result = OrderService._update_transaction_reference(mock_db, 1, "REF-123")
    assert tx.payu_reference == "REF-123"
    mock_db.flush.assert_called_once()


def test_update_transaction_reference_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    result = OrderService._update_transaction_reference(mock_db, 1, "REF-123")
    assert result is None


# ── _update_transaction_status ───────────────────────────────────────────────

def test_update_transaction_status_approved(mock_db):
    tx = MagicMock(spec=Transaction)
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    result = OrderService._update_transaction_status(mock_db, 1, "approved",
                                                      payu_transaction_id="TX-001",
                                                      payu_response_code="00",
                                                      payu_state_pol="4")
    assert tx.status == "approved"
    assert tx.payu_transaction_id == "TX-001"
    assert tx.payu_response_code == "00"
    assert tx.payu_state_pol == "4"
    assert tx.approved_at is not None


def test_update_transaction_status_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    result = OrderService._update_transaction_status(mock_db, 1, "declined")
    assert result is None


def test_update_transaction_status_no_optional_fields(mock_db):
    tx = MagicMock(spec=Transaction)
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    OrderService._update_transaction_status(mock_db, 1, "pending")
    assert tx.status == "pending"


# ── _get_transaction_payment_status ─────────────────────────────────────────

def test_get_transaction_payment_status(mock_db):
    tx = MagicMock(spec=Transaction)
    tx.status = "approved"
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    result = OrderService._get_transaction_payment_status(mock_db, 1)
    assert result == "approved"


def test_get_transaction_payment_status_none(mock_db):
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    result = OrderService._get_transaction_payment_status(mock_db, 1)
    assert result is None


# ── _get_transaction_reference ───────────────────────────────────────────────

def test_get_transaction_reference(mock_db):
    tx = MagicMock(spec=Transaction)
    tx.payu_reference = "REF-XYZ"
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    result = OrderService._get_transaction_reference(mock_db, 1)
    assert result == "REF-XYZ"


def test_get_transaction_reference_none(mock_db):
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    result = OrderService._get_transaction_reference(mock_db, 1)
    assert result is None


# ── _resolve_order_assets ───────────────────────────────────────────────────

def test_resolve_order_assets_none_item(mock_db):
    result = OrderService._resolve_order_assets(mock_db, None)
    assert result == []


def test_resolve_order_assets_with_item_assets(mock_db):
    asset = MagicMock(spec=FileAsset)
    asset.media_role = "main"
    asset.sort_order = 1
    asset.id = 1
    item = MagicMock(spec=OrderItem)
    item.assets = [asset]
    item.product = None

    result = OrderService._resolve_order_assets(mock_db, item)
    assert len(result) == 1


def test_resolve_order_assets_fallback_from_product(mock_db):
    fallback = MagicMock(spec=FileAsset)
    fallback.media_role = "main"
    fallback.sort_order = 1
    fallback.id = 10

    item = MagicMock(spec=OrderItem)
    item.assets = []  # No direct assets
    product = MagicMock()
    product.id = 5
    item.product = product

    mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.first.return_value = fallback

    result = OrderService._resolve_order_assets(mock_db, item)
    assert len(result) == 1


def test_resolve_order_assets_no_product(mock_db):
    item = MagicMock(spec=OrderItem)
    item.assets = []
    item.product = None

    result = OrderService._resolve_order_assets(mock_db, item)
    assert result == []


# ── _resolve_order_asset ────────────────────────────────────────────────────

def test_resolve_order_asset_prefers_non_video(mock_db):
    video_asset = MagicMock(spec=FileAsset)
    video_asset.media_role = "main"
    video_asset.sort_order = 1
    video_asset.id = 1
    video_asset.media_kind = "video"
    video_asset.mime_type = "video/mp4"

    image_asset = MagicMock(spec=FileAsset)
    image_asset.media_role = "gallery"
    image_asset.sort_order = 2
    image_asset.id = 2
    image_asset.media_kind = "image"
    image_asset.mime_type = "image/jpeg"

    item = MagicMock(spec=OrderItem)
    item.assets = [video_asset, image_asset]
    item.product = None

    result = OrderService._resolve_order_asset(mock_db, item)
    assert result.media_kind == "image"


def test_resolve_order_asset_only_video(mock_db):
    video_asset = MagicMock(spec=FileAsset)
    video_asset.media_role = "main"
    video_asset.sort_order = 1
    video_asset.id = 1
    video_asset.media_kind = "video"
    video_asset.mime_type = "video/mp4"

    item = MagicMock(spec=OrderItem)
    item.assets = [video_asset]
    item.product = None

    result = OrderService._resolve_order_asset(mock_db, item)
    assert result is not None  # Returns first (video) as fallback


def test_resolve_order_asset_no_assets(mock_db):
    item = MagicMock(spec=OrderItem)
    item.assets = []
    item.product = None

    result = OrderService._resolve_order_asset(mock_db, item)
    assert result is None


# ── _resolve_company_name ───────────────────────────────────────────────────

def test_resolve_company_name_from_product(mock_db):
    company = MagicMock()
    company.name = "Mi Empresa"
    product = MagicMock()
    product.company = company
    item = MagicMock(spec=OrderItem)
    item.product = product

    result = OrderService._resolve_company_name(item)
    assert result == "Mi Empresa"


def test_resolve_company_name_no_item():
    result = OrderService._resolve_company_name(None)
    assert result is None


def test_resolve_company_name_no_product():
    item = MagicMock(spec=OrderItem)
    item.product = None

    result = OrderService._resolve_company_name(item)
    assert result is None


# ── _paginate ────────────────────────────────────────────────────────────────

def test_paginate_basic(mock_db):
    query = MagicMock()
    query.count.return_value = 25
    items = [MagicMock() for _ in range(10)]
    query.offset.return_value.limit.return_value.all.return_value = items

    result = OrderService._paginate(query, page=1, page_size=10)

    assert result["page"] == 1
    assert result["page_size"] == 10
    assert result["total_items"] == 25
    assert result["total_pages"] == 3
    assert len(result["items"]) == 10


def test_paginate_page_exceeds_total(mock_db):
    query = MagicMock()
    query.count.return_value = 5
    query.offset.return_value.limit.return_value.all.return_value = [
        MagicMock()]

    result = OrderService._paginate(query, page=999, page_size=10)

    assert result["page"] == 1  # Adjusted to last valid page


def test_paginate_zero_results(mock_db):
    query = MagicMock()
    query.count.return_value = 0
    query.offset.return_value.limit.return_value.all.return_value = []

    result = OrderService._paginate(query, page=1, page_size=10)

    assert result["total_items"] == 0
    assert result["total_pages"] == 1


# ── get_dashboard_data ───────────────────────────────────────────────────────

@patch("app.services.order_service.OrderService._serialize_order")
def test_get_dashboard_data_cliente(mock_serialize, mock_db):
    order = MagicMock(spec=Order)
    mock_db.query.return_value.options.return_value.order_by.return_value.filter.return_value.all.return_value = [
        order]
    mock_serialize.return_value = {
        "id": "1", "title": "Pedido", "status": "En diseño",
        "price": 100.0, "deliveryDate": "2024-01-15", "createdAt": "2024-01-08",
        "image": {"bucket": "b", "path": "p"}, "media": [], "productId": 1,
        "productType": "type", "quantity": 1, "attributes": []
    }

    result = OrderService.get_dashboard_data(
    mock_db, user_id=1, role_name="cliente")

    assert "orders" in result
    assert "stats" in result
    assert result["stats"]["design"] == 1


@patch("app.services.order_service.OrderService._serialize_order")
def test_get_dashboard_data_admin(mock_serialize, mock_db):
    mock_db.query.return_value.options.return_value.order_by.return_value.all.return_value = []
    mock_serialize.return_value = {}

    result = OrderService.get_dashboard_data(
    mock_db, user_id=0, role_name="administrador")
    assert "orders" in result


@patch("app.services.order_service.OrderService._serialize_order")
def test_get_dashboard_data_funcionario_no_company(mock_serialize, mock_db):
    mock_db.query.return_value.options.return_value.order_by.return_value.filter.return_value.all.return_value = []

    result = OrderService.get_dashboard_data(
    mock_db, user_id=1, role_name="funcionario_adm", company_id=None)
    assert result["stats"]["total"] == 0


# ── get_user_orders ──────────────────────────────────────────────────────────

@patch("app.services.order_service.OrderService._serialize_order",
       return_value={"id": "1"})
def test_get_user_orders(mock_serialize, mock_db):
    order = MagicMock(spec=Order)
    mock_db.query.return_value.options.return_value.filter.return_value.order_by.return_value.all.return_value = [
        order]

    result = OrderService.get_user_orders(mock_db, user_id=1)
    assert len(result) == 1


# ── update_order_status ──────────────────────────────────────────────────────

def test_update_order_status_not_found(mock_db):
    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = None

    with pytest.raises(ValueError, match="Pedido no encontrado"):
        OrderService.update_order_status(
    mock_db, 1, "Entregado", changed_by_user_id=1)


def test_update_order_status_no_valid_stage(mock_db):
    order = MagicMock(spec=Order)
    item = MagicMock(spec=OrderItem)
    item.current_stage = MagicMock()
    item.current_stage.name = "En diseño"
    item.current_stage_id = 1
    order.items = [item]
    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = order
    mock_db.query.return_value.all.return_value = []  # No stages

    with pytest.raises(ValueError, match="Estado no válido"):
        OrderService.update_order_status(
    mock_db, 1, "Estado Inexistente", changed_by_user_id=1)


# ── get_user_orders_page ─────────────────────────────────────────────────────

@patch("app.services.order_service.OrderService._paginate")
@patch("app.services.order_service.OrderService._serialize_order")
def test_get_user_orders_page_basic(mock_serialize, mock_paginate, mock_db):
    mock_db.query.return_value.options.return_value.filter.return_value.order_by.return_value = MagicMock()
    mock_paginate.return_value = {
        "items": [MagicMock()],
        "page": 1,
        "page_size": 10,
        "total_items": 1,
        "total_pages": 1,
    }
    mock_serialize.return_value = {"id": "1"}

    result = OrderService.get_user_orders_page(mock_db, 1, 1, 10)
    assert result["totalItems"] == 1
    assert result["items"] == [{"id": "1"}]


@patch("app.services.order_service.OrderService._paginate")
@patch("app.services.order_service.OrderService._serialize_order")
def test_get_user_orders_page_with_search_and_status(
    mock_serialize, mock_paginate, mock_db):
    mock_db.query.return_value.options.return_value.filter.return_value.order_by.return_value = MagicMock()
    # For the search subquery
    mock_db.query.return_value.join.return_value.join.return_value.join.return_value.filter.return_value.distinct.return_value = [  # noqa: E501
        1]
    
    mock_paginate.return_value = {
        "items": [],
        "page": 1,
        "page_size": 10,
        "total_items": 0,
        "total_pages": 1,
    }

    result = OrderService.get_user_orders_page(
    mock_db, 1, 1, 10, search="test", status="En diseño")
    assert result["totalItems"] == 0


# ── get_funcionario_orders_page ──────────────────────────────────────────────

@patch("app.services.order_service.OrderService._paginate")
@patch("app.services.order_service.OrderService._serialize_order")
def test_get_funcionario_orders_page(mock_serialize, mock_paginate, mock_db):
    mock_db.query.return_value.options.return_value.order_by.return_value.filter.return_value = MagicMock()
    mock_paginate.return_value = {
        "items": [MagicMock()],
        "page": 2,
        "page_size": 5,
        "total_items": 6,
        "total_pages": 2,
    }
    mock_serialize.return_value = {"id": "1", "clientName": "Juan"}

    result = OrderService.get_funcionario_orders_page(
    mock_db, 2, 5, company_id=1, search="Ana", status="pendiente de pago")
    assert result["page"] == 2
    assert result["pageSize"] == 5


# ── get_admin_orders_page ────────────────────────────────────────────────────

@patch("app.services.order_service.OrderService._paginate")
@patch("app.services.order_service.OrderService._serialize_order")
def test_get_admin_orders_page(mock_serialize, mock_paginate, mock_db):
    mock_db.query.return_value.options.return_value.order_by.return_value = MagicMock()
    mock_paginate.return_value = {
        "items": [],
        "page": 1,
        "page_size": 20,
        "total_items": 0,
        "total_pages": 1,
    }

    result = OrderService.get_admin_orders_page(
    mock_db, 1, 20, search="Company", status="Entregado")
    assert result["totalItems"] == 0


# ── _serialize_order ─────────────────────────────────────────────────────────

@patch("app.services.order_service.OrderService._safe_signed_url", return_value=None)
@patch("app.services.order_service.OrderService._get_transaction_payment_status", return_value=None)
@patch("app.services.order_service.OrderService._resolve_order_assets", return_value=[])
@patch("app.services.order_service.OrderService._resolve_order_asset",
       return_value=None)
def test_serialize_order_no_items(
    mock_asset, mock_assets, mock_pay, mock_url, mock_db):
    order = MagicMock(spec=Order)
    order.id = 99
    order.items = []
    order.total_amount = 50.0
    order.created_at = datetime(2024, 1, 1)

    result = OrderService._serialize_order(mock_db, order)
    assert result["id"] == "99"
    assert result["title"] == "Pedido personalizado"
    assert result["quantity"] == 1


@patch("app.services.order_service.OrderService._safe_signed_url", return_value=None)
@patch("app.services.order_service.OrderService._get_transaction_payment_status",
       return_value="pending")
@patch("app.services.order_service.OrderService._serialize_order_attributes", return_value=[])
@patch("app.services.order_service.OrderService._resolve_order_assets", return_value=[])
@patch("app.services.order_service.OrderService._resolve_order_asset",
       return_value=None)
def test_serialize_order_pending_payment_status(
    mock_asset, mock_assets, mock_attrs, mock_pay, mock_url, mock_db):
    item = MagicMock(spec=OrderItem)
    item.current_stage = MagicMock()
    item.current_stage.name = "En diseño"
    item.product = None
    item.product_id = None
    item.product_type = None
    item.quantity = 2

    order = MagicMock(spec=Order)
    order.id = 1
    order.items = [item]
    order.total_amount = 100.0
    order.created_at = datetime(2024, 1, 1)

    result = OrderService._serialize_order(mock_db, order)
    assert result["status"] == "Pendiente de pago"
    assert result["quantity"] == 2


@patch("app.services.order_service.OrderService._safe_signed_url", return_value=None)
@patch("app.services.order_service.OrderService._get_transaction_payment_status", return_value=None)
@patch("app.services.order_service.OrderService._serialize_order_attributes", return_value=[])
@patch("app.services.order_service.OrderService._resolve_order_assets", return_value=[])
@patch("app.services.order_service.OrderService._resolve_order_asset",
       return_value=None)
def test_serialize_order_include_client(
    mock_asset, mock_assets, mock_attrs, mock_pay, mock_url, mock_db):
    item = MagicMock(spec=OrderItem)
    item.current_stage = MagicMock()
    item.current_stage.name = "Entregado"
    product = MagicMock()
    product.name = "Camiseta"
    product.company = MagicMock()
    product.company.name = "Mi Empresa"
    item.product = product
    item.product_id = 5
    item.product_type = MagicMock()
    item.product_type.name = "Bordado"
    item.quantity = 1

    user_mock = MagicMock()
    user_mock.first_name = "Juan"
    user_mock.last_name = "Perez"

    order = MagicMock(spec=Order)
    order.id = 2
    order.items = [item]
    order.total_amount = 200.0
    order.created_at = datetime(2024, 3, 15)
    order.user = user_mock

    result = OrderService._serialize_order(mock_db, order, include_client=True)
    assert result["clientName"] == "Juan Perez"
    assert result["title"] == "Camiseta"


# ── get_dashboard_data funcionario with company_id ───────────────────────────

@patch("app.services.order_service.OrderService._serialize_order")
def test_get_dashboard_data_funcionario_with_company(mock_serialize, mock_db):
    mock_db.query.return_value.options.return_value.order_by.return_value.filter.return_value.all.return_value = []
    result = OrderService.get_dashboard_data(
    mock_db, user_id=1, role_name="funcionario", company_id=5)
    assert result["stats"]["total"] == 0


# ── update_order_status success path ─────────────────────────────────────────

@patch("app.services.order_service.OrderService._serialize_order",
       return_value={"id": "1"})
def test_update_order_status_same_status(mock_serialize, mock_db):
    """When status is already the same, should return early without commit."""
    order = MagicMock(spec=Order)
    item = MagicMock(spec=OrderItem)
    stage = MagicMock(spec=ProductionStage)
    stage.name = "Entregado"
    stage.id = 5
    item.current_stage = stage
    item.current_stage_id = 5
    order.items = [item]

    target_stage = MagicMock(spec=ProductionStage)
    target_stage.name = "Entregado"
    target_stage.id = 5

    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = order
    mock_db.query.return_value.all.return_value = [target_stage]

    result = OrderService.update_order_status(
    mock_db, 1, "Entregado", changed_by_user_id=1)
    assert result == {"id": "1"}
    mock_db.commit.assert_not_called()


@patch("app.services.order_service.InteractionService.create_delivery_review_notification")
@patch("app.services.order_service.EmailService.send_order_delivered_email",
       return_value={"status": "success"})
@patch("app.services.order_service.OrderService._serialize_order",
       return_value={"id": "1", "status": "Entregado"})
def test_update_order_status_to_entregado(
    mock_serialize, mock_email, mock_notif, mock_db):
    """Update to 'Entregado' triggers email & notification."""
    order = MagicMock(spec=Order)
    item = MagicMock(spec=OrderItem)
    stage = MagicMock(spec=ProductionStage)
    stage.name = "En diseño"
    stage.id = 2
    item.current_stage = stage
    item.current_stage_id = 2
    item.id = 10
    item.product_id = 3
    item.product = MagicMock()
    item.product.name = "Camiseta"
    order.items = [item]
    order.user_id = 1
    order.user = MagicMock()
    order.user.email = "user@test.com"
    order.user.first_name = "Juan"

    target_stage = MagicMock(spec=ProductionStage)
    target_stage.name = "Entregado"
    target_stage.id = 5

    # First call: find order. Second call (after refresh): find updated order.
    mock_db.query.return_value.options.return_value.filter.return_value.first.side_effect = [
        order, order]
    mock_db.query.return_value.all.return_value = [target_stage]

    result = OrderService.update_order_status(
    mock_db, 1, "Entregado", changed_by_user_id=1)
    assert result["id"] == "1"
    mock_db.commit.assert_called()


# ── create_order validation errors ───────────────────────────────────────────

def test_create_order_invalid_user_id(mock_db):
    with pytest.raises(ValueError, match="INTEGER"):
        OrderService.create_order(mock_db, "not_an_int", MagicMock())


def test_create_order_missing_image(mock_db):
    data = MagicMock()
    data.image_url = None
    with pytest.raises(ValueError, match="imagen"):
        OrderService.create_order(mock_db, 1, data)


def test_create_order_missing_attributes(mock_db):
    data = MagicMock()
    data.image_url = "http://url"
    data.attributes = {}
    with pytest.raises(ValueError, match="atributos"):
        OrderService.create_order(mock_db, 1, data)


def test_create_order_missing_shape(mock_db):
    data = MagicMock()
    data.image_url = "http://url"
    data.attributes = {"color": {"label": "Color", "value": "Rojo"}}
    data.shape_id = None
    with pytest.raises(ValueError, match="shape"):
        OrderService.create_order(mock_db, 1, data)


def test_create_order_shape_not_found(mock_db):
    data = MagicMock()
    data.image_url = "http://url"
    data.attributes = {"color": {"label": "Color", "value": "Rojo"}}
    data.shape_id = 99
    data.shape_name = None
    mock_db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(ValueError, match="Shape"):
        OrderService.create_order(mock_db, 1, data)


def test_create_order_product_type_not_found(mock_db):
    data = MagicMock()
    data.image_url = "http://storage/object/sign/bucket/path/img.jpg"
    data.attributes = {"color": {"label": "Color", "value": "Rojo"}}
    data.shape_id = 1
    data.shape_name = "Circular"
    data.product_type = "bordado"
    data.quantity = 1

    shape_mock = MagicMock()
    shape_mock.id = 1
    shape_mock.name = "Circular"

    pending_stage = MagicMock(spec=ProductionStage)
    pending_stage.id = 1
    pending_stage.name = "Pendiente"

    # shape found, but product_type not found (returns None)
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        shape_mock, pending_stage, pending_stage, pending_stage, None
    ]

    with pytest.raises(ValueError, match="Tipo de producto"):
        OrderService.create_order(mock_db, 1, data)


# ── get_pending_custom_orders_page ───────────────────────────────────────────

@patch("app.services.order_service.OrderService._paginate")
@patch("app.services.order_service.OrderService._serialize_order",
       return_value={"id": "1"})
def test_get_pending_custom_orders_page_no_search(
    mock_serialize, mock_paginate, mock_db):
    stage = MagicMock(spec=ProductionStage)
    stage.id = 1
    mock_db.query.return_value.filter.return_value.first.return_value = stage
    mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = stage

    mock_paginate.return_value = {
        "items": [MagicMock()],
        "page": 1,
        "page_size": 10,
        "total_items": 1,
        "total_pages": 1,
    }

    result = OrderService.get_pending_custom_orders_page(mock_db, 1, 10)
    assert result["totalItems"] == 1


# ── accept_pending_custom_order errors ───────────────────────────────────────

def test_accept_pending_custom_order_not_found(mock_db):
    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = None
    with pytest.raises(ValueError, match="no encontrado"):
        OrderService.accept_pending_custom_order(mock_db, 1, 1, 1)


def test_accept_pending_custom_order_wrong_stage(mock_db):
    pending = MagicMock(spec=ProductionStage)
    pending.id = 1
    pending_pay = MagicMock(spec=ProductionStage)
    pending_pay.id = 2

    item = MagicMock(spec=OrderItem)
    item.current_stage_id = 2  # Not pending
    item.product_id = None
    order = MagicMock(spec=Order)
    order.items = [item]

    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = order
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        pending, pending_pay]

    with pytest.raises(ValueError, match="Solo se pueden aceptar"):
        OrderService.accept_pending_custom_order(mock_db, 1, 1, 1)


def test_accept_pending_custom_order_shape_not_found(mock_db):
    pending = MagicMock(spec=ProductionStage)
    pending.id = 1
    pending_pay = MagicMock(spec=ProductionStage)
    pending_pay.id = 2

    item = MagicMock(spec=OrderItem)
    item.current_stage_id = 1
    item.product_id = None
    shape_attr = MagicMock()
    shape_attr.attribute_code = "shape_id"
    shape_attr.value = "999"
    item.attributes = [shape_attr]
    order = MagicMock(spec=Order)
    order.items = [item]

    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = order
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        pending, pending_pay, None, None]

    with pytest.raises(ValueError, match="shape"):
        OrderService.accept_pending_custom_order(mock_db, 1, 1, 1)


# ── create_marketplace_order errors ──────────────────────────────────────────

def test_create_marketplace_order_invalid_user_id(mock_db):
    with pytest.raises(ValueError, match="INTEGER"):
        OrderService.create_marketplace_order(mock_db, "bad", MagicMock())


def test_create_marketplace_order_no_product_id(mock_db):
    data = MagicMock()
    data.product_id = None
    with pytest.raises(ValueError, match="product_id"):
        OrderService.create_marketplace_order(mock_db, 1, data)


def test_create_marketplace_order_product_not_found(mock_db):
    data = MagicMock()
    data.product_id = 99
    data.attributes = {"color": "rojo"}
    # Patch the product lookup to return None at the right level
    from app.models.product import Product as ProductModel
    original_query = mock_db.query
    def query_side_effect(model):
        q = MagicMock()
        q.filter.return_value.filter.return_value.filter.return_value.first.return_value = None
        q.filter.return_value.filter.return_value.first.return_value = None
        q.filter.return_value.first.return_value = None
        return q
    mock_db.query.side_effect = query_side_effect
    with pytest.raises(ValueError, match="Producto no existe"):
        OrderService.create_marketplace_order(mock_db, 1, data)


# ── get_order_detail ─────────────────────────────────────────────────────────

def test_get_order_detail_admin_not_found(mock_db):
    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = None
    result = OrderService.get_order_detail(mock_db, 999, 1, "administrador")
    assert result is None


@patch("app.services.order_service.OrderService._get_transaction_payment_status", return_value=None)
@patch("app.services.order_service.OrderService._safe_signed_url", return_value=None)
@patch("app.services.order_service.OrderService._serialize_order_attributes", return_value=[])
@patch("app.services.order_service.OrderService._resolve_order_assets", return_value=[])
@patch("app.services.order_service.OrderService._resolve_order_asset",
       return_value=None)
def test_get_order_detail_admin_success(
    mock_asset, mock_assets, mock_attrs, mock_url, mock_pay, mock_db):
    item = MagicMock(spec=OrderItem)
    item.current_stage = MagicMock()
    item.current_stage.name = "En diseño"
    item.product = None
    item.product_id = None
    item.product_type = None
    item.quantity = 1

    user_mock = MagicMock()
    user_mock.first_name = "Test"
    user_mock.last_name = "User"

    order = MagicMock(spec=Order)
    order.id = 5
    order.items = [item]
    order.total_amount = 100.0
    order.created_at = datetime(2024, 5, 1)
    order.user = user_mock
    order.user_id = 1

    mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = order

    result = OrderService.get_order_detail(mock_db, 5, 1, "administrador")
    assert result is not None
    assert result["id"] == "5"
    assert result["clientName"] == "Test User"


def test_get_order_detail_cliente_own_order(mock_db):
    mock_db.query.return_value.options.return_value.filter.return_value.filter.return_value.first.return_value = None
    result = OrderService.get_order_detail(mock_db, 99, 1, "cliente")
    assert result is None


def test_get_order_detail_funcionario_no_company_no_pending(mock_db):
    mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.first.return_value = None
    result = OrderService.get_order_detail(
    mock_db, 1, 1, "funcionario", company_id=None)
    assert result is None


# ── generate_payment_url ─────────────────────────────────────────────────────

def test_generate_payment_url_order_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    result = OrderService.generate_payment_url(mock_db, 999)
    assert result["status"] == "error"
    assert "no encontrada" in result["error"]


@patch("app.services.order_service.OrderService._get_transaction_payment_status",
       return_value="approved")
def test_generate_payment_url_already_paid(mock_pay, mock_db):
    order = MagicMock(spec=Order)
    order.id = 1
    mock_db.query.return_value.filter.return_value.first.return_value = order
    result = OrderService.generate_payment_url(mock_db, 1)
    assert result["status"] == "error"
    assert "pagada" in result["error"]


@patch("app.services.order_service.payu_provider")
@patch("app.services.order_service.OrderService._update_transaction_reference")
@patch("app.services.order_service.OrderService._get_transaction_payment_status",
       return_value="pending")
def test_generate_payment_url_success(mock_pay, mock_ref, mock_payu, mock_db):
    order = MagicMock(spec=Order)
    order.id = 1
    order.total_amount = 100.0
    order.user = MagicMock()
    order.user.email = "test@test.com"
    order.user.first_name = "Test"
    order.user.last_name = "User"

    mock_db.query.return_value.filter.return_value.first.return_value = order
    mock_payu.generate_payment_url.return_value = {
        "status": "success",
        "payment_url": "https://payu.com/pay",
        "payment_reference": "REF-001",
    }

    result = OrderService.generate_payment_url(mock_db, 1)
    assert result["status"] == "success"


@patch("app.services.order_service.OrderService._get_transaction_payment_status", return_value=None)
def test_generate_payment_url_no_user(mock_pay, mock_db):
    order = MagicMock(spec=Order)
    order.id = 1
    order.total_amount = 100.0
    order.user = None
    order.user_id = 1

    tx = MagicMock(spec=Transaction)
    mock_db.query.return_value.filter.return_value.first.return_value = order
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    result = OrderService.generate_payment_url(mock_db, 1)
    assert result["status"] == "error"
    assert "Usuario" in result["error"]


# ── process_payu_webhook ─────────────────────────────────────────────────────

def test_process_payu_webhook_no_order_id(mock_db):
    result = OrderService.process_payu_webhook(mock_db, {})
    assert result["status"] == "error"
    assert "order_id" in result["message"]


def test_process_payu_webhook_order_not_found(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    result = OrderService.process_payu_webhook(mock_db, {"extra1": "999"})
    assert result["status"] == "error"
    assert "no encontrada" in result["message"]


def test_process_payu_webhook_order_id_from_reference(mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    result = OrderService.process_payu_webhook(
        mock_db, {"referenceCode": "ORDER-42-XYZ"})
    assert result["status"] == "error"
    assert "42" in result["message"]


@patch("app.services.order_service.payu_provider")
@patch("app.services.order_service.OrderService._update_transaction_status")
@patch("app.services.order_service.OrderService._ensure_stage")
@patch("app.services.order_service.OrderService._get_transaction_payment_status", return_value=None)
def test_process_payu_webhook_approved(
    mock_pay_status, mock_stage, mock_update_tx, mock_payu, mock_db):
    order = MagicMock(spec=Order)
    order.id = 1
    order.user_id = 1
    order.total_amount = 100.0
    order.user = MagicMock()
    order.user.email = "test@test.com"
    order.user.first_name = "Test"
    item = MagicMock(spec=OrderItem)
    item.current_stage_id = 2
    item.product = None
    item.product_type = None
    order.items = [item]

    design_stage = MagicMock(spec=ProductionStage)
    design_stage.id = 3
    mock_stage.return_value = design_stage

    mock_db.query.return_value.filter.return_value.first.return_value = order
    mock_payu.is_payment_approved.return_value = True

    with patch("app.services.order_service.EmailService.send_payment_confirmed_email", return_value={"status": "success"}):  # noqa: E501
        result = OrderService.process_payu_webhook(
            mock_db, {"extra1": "1", "transactionId": "TX-001"})
    assert result["status"] == "success"
    assert result["payment_status"] == "approved"


@patch("app.services.order_service.payu_provider")
@patch("app.services.order_service.OrderService._restore_inventory")
@patch("app.services.order_service.OrderService._update_transaction_status")
@patch("app.services.order_service.OrderService._ensure_stage")
@patch("app.services.order_service.OrderService._get_transaction_payment_status", return_value=None)
def test_process_payu_webhook_declined(
    mock_pay_status, mock_stage, mock_update_tx, mock_restore, mock_payu, mock_db):
    order = MagicMock(spec=Order)
    order.id = 1
    order.user_id = 1
    item = MagicMock(spec=OrderItem)
    item.current_stage_id = 2
    item.product_id = 5
    item.quantity = 1
    order.items = [item]

    pending_stage = MagicMock(spec=ProductionStage)
    pending_stage.id = 4
    mock_stage.return_value = pending_stage

    mock_db.query.return_value.filter.return_value.first.return_value = order
    mock_payu.is_payment_approved.return_value = False
    mock_payu.get_payment_status.return_value = "declined"

    result = OrderService.process_payu_webhook(
        mock_db, {"extra1": "1", "statePol": "6"})
    assert result["status"] == "payment_pending"
    assert result["payment_status"] == "declined"


# ── get_order_payment_status ─────────────────────────────────────────────────

def test_get_order_payment_status_no_transaction(mock_db):
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None
    result = OrderService.get_order_payment_status(mock_db, 1)
    assert result["status"] == "error"
    assert "transacción" in result["message"]


def test_get_order_payment_status_found(mock_db):
    tx = MagicMock(spec=Transaction)
    tx.status = "approved"
    tx.payu_reference = "REF-001"
    tx.approved_at = datetime(2024, 6, 1)
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    result = OrderService.get_order_payment_status(mock_db, 1)
    assert result["status"] == "success"
    assert result["payment_status"] == "approved"
    assert result["payment_reference"] == "REF-001"


def test_get_order_payment_status_no_approved_at(mock_db):
    tx = MagicMock(spec=Transaction)
    tx.status = "pending"
    tx.payu_reference = None
    tx.approved_at = None
    mock_db.query.return_value.filter.return_value.order_by.return_value.first.return_value = tx

    result = OrderService.get_order_payment_status(mock_db, 1)
    assert result["payment_approved_at"] is None
