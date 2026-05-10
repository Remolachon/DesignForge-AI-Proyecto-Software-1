from pydantic import BaseModel


class ReviewCreateRequest(BaseModel):
    product_id: int
    rating: int
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: int
    productId: int
    userId: int
    rating: int
    comment: str | None = None
    createdAt: str
    userName: str


class ProductReviewsResponse(BaseModel):
    items: list[ReviewResponse]
    totalItems: int


class NotificationResponse(BaseModel):
    id: int
    userId: int
    title: str
    message: str
    type: str | None = None
    linkUrl: str | None = None
    isRead: bool
    createdAt: str


class NotificationsResponse(BaseModel):
    items: list[NotificationResponse]
    unreadCount: int