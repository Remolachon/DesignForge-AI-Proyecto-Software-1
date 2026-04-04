from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class FileAsset(Base):
    __tablename__ = "file_assets"

    id = Column(Integer, primary_key=True, index=True)
    bucket_name = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"))
    is_active = Column(Boolean, default=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"))
    
    order_item = relationship("OrderItem")