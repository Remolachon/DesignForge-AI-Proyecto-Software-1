from pydantic import BaseModel


class CreateOrderRequest(BaseModel):
    product_type: str
    image_url: str | None
    size: str
    material: str
    color: str


class OrderResponse(BaseModel):
    order_id: int
    total_amount: float