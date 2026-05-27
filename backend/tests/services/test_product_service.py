import pytest
import app.main  # Forzar inicialización de mappers de SQLAlchemy
from unittest.mock import MagicMock, patch
from datetime import datetime
from app.services.product_service import ProductService
from app.models.product import Product
from app.models.product_type import ProductType
from app.models.product_shape import ProductShape
from app.models.product_attribute import ProductAttribute
from app.models.product_attribute_value import ProductAttributeValue
from app.models.file_assets import FileAsset
from app.schemas.product_schema import AdminProductUpsertRequest

@pytest.fixture
def mock_db():
    return MagicMock()

def test_ensure_product_attribute_values_table(mock_db):
    mock_db.get_bind.return_value = "mock_bind"
    with patch("app.models.product_attribute_value.ProductAttributeValue.__table__.create") as mock_create:
        ProductService._ensure_product_attribute_values_table(mock_db)
        mock_create.assert_called_once_with(bind="mock_bind", checkfirst=True)

def test_upsert_product_attribute_values(mock_db):
    shape_attributes = [
        ProductAttribute(code="color", label="Color", required=False),
        ProductAttribute(code="size", label="Size", required=True),
        ProductAttribute(code="weight", label="Weight", required=False)
    ]
    values = {"size": "L", "weight": "1kg"}
    
    ProductService._upsert_product_attribute_values(
        mock_db, 1, shape_attributes, values)
    
    mock_db.query.return_value.filter.return_value.delete.assert_called_once()
    assert mock_db.add.call_count == 2

def test_upsert_product_attribute_values_required_error(mock_db):
    shape_attributes = [
    ProductAttribute(
        code="size",
        label="Size",
         required=True)]
    values = {}
    with pytest.raises(ValueError) as exc_info:
        ProductService._upsert_product_attribute_values(
            mock_db, 1, shape_attributes, values)
    assert "obligatorio" in str(exc_info.value)

def test_now_local_iso():
    iso = ProductService._now_local_iso()
    assert len(iso.split("-")) == 3

def test_normalize_type_name():
    assert ProductService._normalize_type_name("  Test-Type  ") == "test type"
    assert ProductService._normalize_type_name(None) == ""

def test_resolve_product_type(mock_db):
    mock_type = ProductType(id=1, name="test type")
    mock_db.query.return_value.all.return_value = [mock_type]
    
    res = ProductService._resolve_product_type(mock_db, "Test-Type")
    assert res == mock_type
    
    res_none = ProductService._resolve_product_type(mock_db, "Unknown")
    assert res_none is None

def test_resolve_product_shape(mock_db):
    mock_shape = ProductShape(id=1, name="test shape")
    mock_db.query.return_value.all.return_value = [mock_shape]
    
    res = ProductService._resolve_product_shape(mock_db, "Test-Shape")
    assert res == mock_shape
    
    res_none = ProductService._resolve_product_shape(mock_db, "Unknown")
    assert res_none is None

def test_build_public_image():
    assert ProductService._build_public_image(None) is None
    assert ProductService._build_public_image(
        "http://test.com") == "http://test.com"
    assert ProductService._build_public_image(
    "path/to/img",
     "bucket") == "https://ttfwjexqplbbcfdfhxsg.supabase.co/storage/v1/object/public/bucket/path/to/img"
    assert ProductService._build_public_image(
        "path/to/img") == "https://ttfwjexqplbbcfdfhxsg.supabase.co/storage/v1/object/public/product-catalog/path/to/img"  # noqa: E501

def test_serialize_admin_product():
    class MockRow:
        id = 1
        company_id = 10
        name = "Test Product"
        description = "Desc"
        base_price = 100.0
        product_type = "type"
        product_shape = "shape"
        product_shape_id = 1
        quantity = 5
        is_active = True
        is_public = True
        avg_rating = 4.5
        review_count = 10
        storage_path = "legacy_path"
    
    row = MockRow()
    asset1 = FileAsset(
    id=1,
    storage_path="path1",
    bucket_name="b1",
    sort_order=1,
    media_kind="image",
    media_role="main",
    file_type="img",
    mime_type="image/jpeg",
    size_bytes=100,
    width=800,
    height=600,
    duration_seconds=None,
     extension="jpg")
    asset2 = FileAsset(
    id=2,
    storage_path="path2",
    bucket_name="b1",
    sort_order=2,
    media_kind="image",
    media_role="gallery",
    file_type="img",
    mime_type="image/jpeg",
    size_bytes=100,
    width=800,
    height=600,
    duration_seconds=None,
     extension="jpg")
    
    res = ProductService._serialize_admin_product(row, [asset1, asset2])
    assert res.id == 1
    assert len(res.media) == 2
    assert "b1/path1" in res.imageUrl
    
    # Test without assets (uses fallback storage_path)
    res_fallback = ProductService._serialize_admin_product(row, [])
    assert "product-catalog/legacy_path" in res_fallback.imageUrl

@patch("app.services.product_service.ProductService.get_product_attributes")
def test_get_products(mock_get_attributes, mock_db):
    mock_get_attributes.return_value = []
    class MockRow:
        id = 1
        company_id = 10
        name = "Test"
        description = "Desc"
        base_price = 100
        is_active = True
        is_public = True
        product_type = "type"
        product_shape_id = 1
        product_shape = "shape"
        quantity = 5
        avg_rating = 4.5
        review_count = 10

    mock_db.query.return_value.join.return_value.outerjoin.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value.filter.return_value.group_by.return_value.all.return_value = [  # noqa: E501
        MockRow()]
    mock_db.query.return_value.filter.return_value.all.return_value = []
    
    res = ProductService.get_products(mock_db)
    assert len(res) == 1
    assert res[0].title == "Test"

def test_logical_delete_product(mock_db):
    mock_product = Product(id=1, is_active=True)
    mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_product
    
    ProductService.logical_delete_product(mock_db, 1, 10)
    assert mock_product.is_active is False
    mock_db.commit.assert_called_once()
    
    # Not found
    mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = None
    with pytest.raises(ValueError):
        ProductService.logical_delete_product(mock_db, 1, 10)

def test_set_product_visibility(mock_db):
    mock_product = Product(id=1, is_active=True, is_public=False)
    mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_product
    
    with patch("app.services.product_service.ProductService.get_admin_products", return_value=[MagicMock(id=1)]):
        res = ProductService.set_product_visibility(mock_db, 1, True, 10)
        assert mock_product.is_public is True
        mock_db.commit.assert_called_once()

@patch("app.services.product_service.ProductService.get_product_attributes")
def test_get_admin_products(mock_get_attributes, mock_db):
    mock_get_attributes.return_value = []
    class MockRow:
        id = 1
        company_id = 10
        name = "Test"
        description = "Desc"
        base_price = 100
        is_active = True
        is_public = True
        product_type = "type"
        product_shape_id = 1
        product_shape = "shape"
        quantity = 5
        avg_rating = 4.5
        review_count = 10

    mock_db.query.return_value.join.return_value.outerjoin.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value.filter.return_value.group_by.return_value.all.return_value = [  # noqa: E501
        MockRow()]
    mock_db.query.return_value.filter.return_value.all.return_value = []
    
    res = ProductService.get_admin_products(mock_db, company_id=10)
    assert len(res) == 1
    assert res[0].name == "Test"

@patch("app.services.product_service.ProductService._resolve_product_type")
@patch("app.services.product_service.ProductService._resolve_product_shape")
@patch("app.services.product_service.ProductService._upsert_product_attribute_values")
@patch("app.services.product_service.ProductService.get_admin_products")
def test_create_admin_product(
    mock_get_admin, mock_upsert, mock_resolve_shape, mock_resolve_type, mock_db):
    mock_type = ProductType(id=1)
    mock_shape = ProductShape(id=1)
    mock_resolve_type.return_value = mock_type
    mock_resolve_shape.return_value = mock_shape
    # Using id=None because product.id is None without real DB
    mock_get_admin.return_value = [MagicMock(id=None)]
    
    payload = AdminProductUpsertRequest(
        name="Test",
        description="Desc",
        basePrice=100.0,
        productType="type",
        productShape="shape",
        stock=10,
        imageStoragePath="path",
        shapeAttributes={}
    )
    
    # We patch the matching loop to prevent ValueError, or mock product.id
    def add_side_effect(obj):
        if isinstance(obj, Product):
            obj.id = 1
    mock_db.add.side_effect = add_side_effect
    mock_get_admin.return_value = [MagicMock(id=1)]
    
    res = ProductService.create_admin_product(mock_db, payload, 10, 1)
    assert res.id == 1
    mock_db.add.assert_called()
    mock_db.flush.assert_called()
    mock_db.commit.assert_called()
    mock_upsert.assert_called()

def test_get_product_shapes(mock_db):
    mock_shape = ProductShape(id=1, name="Shape 1")
    mock_db.query.return_value.order_by.return_value.all.return_value = [
        mock_shape]
    res = ProductService.get_product_shapes(mock_db)
    assert len(res) == 1
    assert res[0]["name"] == "Shape 1"

def test_get_shape_attributes(mock_db):
    mock_shape = ProductShape(id=1, name="Shape 1")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_shape
    
    mock_attr = ProductAttribute(
    id=1,
    code="color",
    label="Color",
    input_type="text",
    required=True,
    placeholder="C",
     sort_order=1)
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
        mock_attr]
    
    mock_val = ProductAttributeValue(attribute_code="color", value="Red")
    mock_db.query.return_value.join.return_value.filter.return_value.all.return_value = [
        mock_val]
    
    res = ProductService.get_shape_attributes(mock_db, 1)
    assert len(res) == 1
    assert res[0].code == "color"
    assert res[0].default_value == "Red"

@patch("app.services.product_service.ProductService.get_product_attributes")
def test_get_admin_products_page(mock_get_attributes, mock_db):
    mock_get_attributes.return_value = []
    class MockRow:
        id = 1
        company_id = 10
        name = "Test"
        description = "Desc"
        base_price = 100
        is_active = True
        is_public = True
        product_type = "type"
        product_shape_id = 1
        product_shape = "shape"
        quantity = 5
        avg_rating = 4.5
        review_count = 10

    mock_db.query.return_value.join.return_value.outerjoin.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value.filter.return_value.filter.return_value.group_by.return_value.offset.return_value.limit.return_value.all.return_value = [  # noqa: E501
        MockRow()]
    mock_db.query.return_value.join.return_value.outerjoin.return_value.outerjoin.return_value.filter.return_value.filter.return_value.filter.return_value.scalar.return_value = 1  # noqa: E501
    
    mock_db.query.return_value.filter.return_value.all.return_value = []
    
    res = ProductService.get_admin_products_page(
        mock_db, company_id=10, search="Test")
    assert res["totalItems"] == 1
    assert len(res["items"]) == 1

@patch("app.services.product_service.ProductService._resolve_product_type")
@patch("app.services.product_service.ProductService._resolve_product_shape")
@patch("app.services.product_service.ProductService._upsert_product_attribute_values")
@patch("app.services.product_service.ProductService.get_admin_products")
def test_update_admin_product(
    mock_get_admin, mock_upsert, mock_resolve_shape, mock_resolve_type, mock_db):
    mock_type = ProductType(id=1)
    mock_shape = ProductShape(id=1)
    mock_resolve_type.return_value = mock_type
    mock_resolve_shape.return_value = mock_shape
    
    mock_product = Product(id=1, product_shape_id=1, is_active=True)
    mock_db.query.return_value.filter.return_value.filter.return_value.first.return_value = mock_product
    mock_db.query.return_value.filter.return_value.first.return_value = mock_shape
    
    payload = AdminProductUpsertRequest(
        name="Test2",
        description="Desc2",
        basePrice=150.0,
        productType="type",
        productShape="shape",
        stock=20,
        imageStoragePath="path2",
        shapeAttributes={}
    )
    
    mock_get_admin.return_value = [MagicMock(id=1)]
    
    res = ProductService.update_admin_product(
        mock_db, 1, payload, company_id=10)
    assert res.id == 1
    assert mock_product.name == "Test2"
    mock_db.commit.assert_called()
