from enum import Enum
from typing import Optional
from pydantic import BaseModel


class TimeFilter(str, Enum):
    day = "day"
    week = "week"
    month = "month"
    year = "year"


class SalesSummarySchema(BaseModel):
    total_ventas: float
    total_ganancias: float
    total_transacciones: int
    transacciones_aprobadas: int
    ticket_promedio: float
    tasa_aprobacion: float


class ChartDataPointSchema(BaseModel):
    label: str
    ventas: float
    ganancias: float
    transacciones: int


class SalesChartSchema(BaseModel):
    filter: TimeFilter
    data: list[ChartDataPointSchema]


class TransactionItemSchema(BaseModel):
    id: int
    order_id: int
    customer_name: str
    customer_email: str
    amount: float
    status: str
    payment_method: str
    transaction_date: Optional[str]
    approved_at: Optional[str]
    payu_reference: Optional[str]
    items_count: int


class TransactionsListSchema(BaseModel):
    total: int
    items: list[TransactionItemSchema]
