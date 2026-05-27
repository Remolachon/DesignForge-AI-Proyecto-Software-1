from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from app.database.database import Base


class ProductAttributeValue(Base):
    __tablename__ = "product_attribute_values"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey(
        "products.id", ondelete="CASCADE"), nullable=False)
    attribute_code = Column(String(50), nullable=False)
    attribute_label = Column(String(100), nullable=False)
    value = Column(String(255), nullable=False)

    __table_args__ = (
        UniqueConstraint("product_id", "attribute_code",
                         name="uq_product_attribute_value_code"),
    )
