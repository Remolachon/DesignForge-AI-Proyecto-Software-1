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