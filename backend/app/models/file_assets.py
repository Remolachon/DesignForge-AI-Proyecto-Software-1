from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, BigInteger, SmallInteger, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class FileAsset(Base):
    __tablename__ = "file_assets"

    id = Column(Integer, primary_key=True, index=True)
    bucket_name = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    size_bytes = Column(BigInteger, nullable=True)
    sort_order = Column(SmallInteger, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=True)
    transaction_id = Column(Integer, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    generation_prompt = Column(String, nullable=True)
    generation_version = Column(SmallInteger, nullable=True)
    media_kind = Column(String, nullable=True)
    media_role = Column(String, nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    extension = Column(String, nullable=True)
    checksum_sha256 = Column(String, nullable=True)
    processing_status = Column(String, nullable=True)
    visibility = Column(String, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    order_item = relationship("OrderItem", back_populates="assets")
    product = relationship("Product", back_populates="file_assets")