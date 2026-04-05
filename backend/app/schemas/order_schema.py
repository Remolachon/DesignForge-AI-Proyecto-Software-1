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


class DashboardImage(BaseModel):
    bucket: str
    path: str


class DashboardOrder(BaseModel):
    id: str
    title: str
    status: str
    price: float
    deliveryDate: str
    createdAt: str
    image: DashboardImage
    imageUrl: str | None = None
    clientName: str | None = None


class DashboardStats(BaseModel):
    total: int
    design: int
    production: int
    ready: int
    active: int


class DashboardResponse(BaseModel):
    orders: list[DashboardOrder]
    stats: DashboardStats