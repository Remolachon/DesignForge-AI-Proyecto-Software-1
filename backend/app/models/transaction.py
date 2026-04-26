from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_method = Column(String(50), default="payu")  # payu, credit_card, etc.
    amount = Column(Numeric, nullable=False)  # Monto total incluyendo IVA
    status = Column(String(50), default="pending")  # pending, approved, declined, expired, cancelled, refunded
    transaction_date = Column(DateTime, server_default=func.now())
    
    # PayU-specific fields
    payu_reference = Column(String(255), nullable=True)  # Referencia de PayU (ORDER-123-...)
    payu_transaction_id = Column(String(255), nullable=True)  # Transaction ID de PayU
    payu_response_code = Column(String(50), nullable=True)  # APPROVED, DECLINED, etc.
    payu_state_pol = Column(String(50), nullable=True)  # 2=approved, 3=declined, etc.
    
    # Metadata
    notes = Column(Text, nullable=True)  # Notas adicionales del pago
    approved_at = Column(DateTime, nullable=True)  # Fecha de aprobación
    
    # Relationships
    order = relationship("Order", backref="transactions")
    user = relationship("User", backref="transactions")
