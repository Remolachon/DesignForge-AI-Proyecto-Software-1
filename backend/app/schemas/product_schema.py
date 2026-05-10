from pydantic import BaseModel

class FileAssetResponse(BaseModel):
    id: int
    storage_path: str
    media_kind: str | None = None
    media_role: str | None = None
    sort_order: int | None = None
    file_type: str | None = None
    mime_type: str | None = None
    size_bytes: int | None = None
    width: int | None = None
    height: int | None = None
    duration_seconds: int | None = None
    extension: str | None = None

class ProductResponse(BaseModel):
    id: int
    title: str
    description: str
    imageUrl: str | None
    media: list[FileAssetResponse] = []
    price: float
    rating: float
    reviews: int
    inStock: bool
    productType: str


class AdminProductResponse(BaseModel):
    id: int
    companyId: int | None = None
    name: str
    description: str
    basePrice: float
    productType: str
    imageUrl: str | None
    media: list[FileAssetResponse] = []
    inStock: bool
    stock: int
    isActive: bool
    isPublic: bool
    rating: float
    reviews: int
    createdAt: str


class AdminProductUpsertRequest(BaseModel):
    name: str
    description: str
    basePrice: float
    productType: str
    stock: int
    imageStoragePath: str | None = None


class AdminProductVisibilityRequest(BaseModel):
    is_public: bool