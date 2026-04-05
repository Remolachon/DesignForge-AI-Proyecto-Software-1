from pydantic import BaseModel

class ProductResponse(BaseModel):
    id: int
    title: str
    description: str
    imageUrl: str | None
    price: float
    rating: float
    reviews: int
    inStock: bool
    productType: str


class AdminProductResponse(BaseModel):
    id: int
    name: str
    description: str
    basePrice: float
    productType: str
    imageUrl: str | None
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