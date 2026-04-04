from sqlalchemy import Column, Integer, String
from app.database.database import Base

class ProductionStage(Base):
    __tablename__ = "production_stages"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)