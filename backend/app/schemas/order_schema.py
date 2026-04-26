from pydantic import BaseModel


class CreateOrderRequest(BaseModel):
    product_type: str
    image_url: str | None
    size: str
    material: str
    color: str


class CreateMarketplaceOrderRequest(BaseModel):
    product_id: int
    length: int
    height: int
    width: int
    material: str


class OrderResponse(BaseModel):
    order_id: int
    total_amount: float


class DashboardImage(BaseModel):
    bucket: str
    path: str


class OrderParameters(BaseModel):
    length: int
    height: int
    width: int
    material: str


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
    productType: str | None = None


class OrderDetailResponse(BaseModel):
    """Detalles completos de un pedido con parámetros"""
    id: str
    title: str
    status: str
    price: float
    deliveryDate: str
    createdAt: str
    image: DashboardImage
    imageUrl: str | None = None
    clientName: str | None = None
    productType: str | None = None
    quantity: int
    parameters: OrderParameters | None = None


class DashboardStats(BaseModel):
    total: int
    design: int
    production: int
    ready: int
    active: int


class DashboardResponse(BaseModel):
    orders: list[DashboardOrder]
    stats: DashboardStats


class OrdersPageResponse(BaseModel):
    items: list[DashboardOrder]
    page: int
    pageSize: int
    totalItems: int
    totalPages: int


class UpdateOrderStatusRequest(BaseModel):
    status: str


class UpdateOrderStatusResponse(BaseModel):
    message: str
    order: DashboardOrder