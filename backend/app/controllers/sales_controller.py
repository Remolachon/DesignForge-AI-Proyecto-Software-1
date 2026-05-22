import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.database.database import get_db
from app.database.connection_retry import retry_on_connection_error
from app.models.user import User
from app.security.token_validator import get_current_user
from app.services.user_service import UserService
from app.schemas.sales_schema import (
    TimeFilter,
    SalesSummarySchema,
    SalesChartSchema,
    TransactionsListSchema,
)
from app.services.sales_service import (
    get_sales_summary,
    get_sales_chart,
    get_transactions_list,
    get_company_sales_summary,
    get_company_sales_chart,
    get_company_transactions_list,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/sales", tags=["Admin - Ventas"])
funcionario_router = APIRouter(prefix="/funcionario/sales", tags=["Funcionario - Ventas"])


# ─── Auth helpers ─────────────────────────────────────────────────────────────

def _require_admin(db: Session, current_user) -> User:
    """Verifica que el usuario autenticado tenga rol de administrador."""
    def _query():
        db_user = db.query(User).filter(User.supabase_id == current_user.id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no existe en DB")
        role_name = UserService.get_user_role_name(db, db_user.id)
        if role_name != "administrador":
            raise HTTPException(status_code=403, detail="No autorizado")
        return db_user

    try:
        return retry_on_connection_error(_query, max_retries=3)
    except OperationalError as e:
        logger.error(f"Error de BD en sales_controller (admin): {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )


def _require_funcionario(db: Session, current_user) -> tuple[User, int]:
    """
    Verifica que el usuario tenga rol de funcionario y esté asociado a una empresa.
    Retorna (db_user, company_id).
    """
    def _query():
        db_user = db.query(User).filter(User.supabase_id == current_user.id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no existe en DB")
        role_name = UserService.get_user_role_name(db, db_user.id)
        if role_name != "funcionario":
            raise HTTPException(status_code=403, detail="No autorizado")
        if not db_user.company_id:
            raise HTTPException(
                status_code=400,
                detail="El funcionario no está asociado a ninguna empresa",
            )
        return db_user, db_user.company_id

    try:
        return retry_on_connection_error(_query, max_retries=3)
    except OperationalError as e:
        logger.error(f"Error de BD en sales_controller (funcionario): {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )


# ─── Admin endpoints ──────────────────────────────────────────────────────────

@router.get("/summary", response_model=SalesSummarySchema)
def get_summary(
    filter: TimeFilter = Query(TimeFilter.month, description="Período de tiempo"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retorna métricas resumidas de ventas y transacciones para el período indicado."""
    _require_admin(db, current_user)
    try:
        return get_sales_summary(db, filter)
    except OperationalError as e:
        logger.error(f"Error de BD en /admin/sales/summary: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@router.get("/chart", response_model=SalesChartSchema)
def get_chart(
    filter: TimeFilter = Query(TimeFilter.month, description="Período de tiempo"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retorna datos agrupados por período para la gráfica de ventas y ganancias."""
    _require_admin(db, current_user)
    try:
        return get_sales_chart(db, filter)
    except OperationalError as e:
        logger.error(f"Error de BD en /admin/sales/chart: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@router.get("/transactions", response_model=TransactionsListSchema)
def get_transactions(
    filter: TimeFilter = Query(TimeFilter.month, description="Período de tiempo"),
    status: Optional[str] = Query(None, description="Filtrar por estado (approved, pending, etc.)"),
    limit: int = Query(20, ge=1, le=100, description="Número de resultados por página"),
    offset: int = Query(0, ge=0, description="Desplazamiento para paginación"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retorna la lista paginada de transacciones con datos del cliente y la orden."""
    _require_admin(db, current_user)
    try:
        return get_transactions_list(db, filter, status, limit, offset)
    except OperationalError as e:
        logger.error(f"Error de BD en /admin/sales/transactions: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )


# ─── Funcionario endpoints (filtrados por company_id) ────────────────────────

@funcionario_router.get("/summary", response_model=SalesSummarySchema)
def get_company_summary(
    filter: TimeFilter = Query(TimeFilter.month, description="Período de tiempo"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Métricas de ventas de la empresa del funcionario autenticado."""
    _, company_id = _require_funcionario(db, current_user)
    try:
        return get_company_sales_summary(db, filter, company_id)
    except OperationalError as e:
        logger.error(f"Error de BD en /funcionario/sales/summary: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@funcionario_router.get("/chart", response_model=SalesChartSchema)
def get_company_chart(
    filter: TimeFilter = Query(TimeFilter.month, description="Período de tiempo"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Gráfica de ventas de la empresa del funcionario autenticado."""
    _, company_id = _require_funcionario(db, current_user)
    try:
        return get_company_sales_chart(db, filter, company_id)
    except OperationalError as e:
        logger.error(f"Error de BD en /funcionario/sales/chart: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )


@funcionario_router.get("/transactions", response_model=TransactionsListSchema)
def get_company_transactions(
    filter: TimeFilter = Query(TimeFilter.month, description="Período de tiempo"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Lista paginada de transacciones de la empresa del funcionario autenticado."""
    _, company_id = _require_funcionario(db, current_user)
    try:
        return get_company_transactions_list(db, filter, company_id, status, limit, offset)
    except OperationalError as e:
        logger.error(f"Error de BD en /funcionario/sales/transactions: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible",
        )
