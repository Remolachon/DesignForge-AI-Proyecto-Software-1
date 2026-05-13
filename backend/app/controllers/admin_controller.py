import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.database.database import get_db
from app.database.connection_retry import retry_on_connection_error
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.security.token_validator import get_current_user
from app.schemas.order_schema import OrdersPageResponse
from app.services.company_service import CompanyService
from app.services.order_service import OrderService
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin_with_retry(db: Session, current_user):
    """Verifica permisos de administrador con reintentos automáticos"""
    def _query():
        db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

        if not db_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe en DB")

        role_name = UserService.get_user_role_name(db, db_user.id)
        if role_name != "administrador":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

        return db_user
    
    try:
        return retry_on_connection_error(_query, max_retries=3)
    except OperationalError as e:
        logger.error(f"Error de BD en admin_controller: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin_with_retry(db, current_user)

    try:
        order_data = OrderService.get_dashboard_data(db=db, user_id=0, role_name="administrador")
        recent_orders = order_data["orders"][:3]
        company_counts = CompanyService.get_admin_company_counts(db)
        client_role = db.query(Role).filter(Role.name == "cliente").first()
        total_users = 0

        if client_role is not None:
            total_users = (
                db.query(User)
                .join(UserRole, User.id == UserRole.user_id)
                .filter(
                    User.is_active == True,
                    UserRole.is_active == True,
                    UserRole.role_id == client_role.id,
                )
                .count()
            )

        return {
            "stats": {
                "total_sales": 128450000,
                "active_companies": company_counts["active"],
                "total_users": total_users,
                "income": 9840000,
                "pending_companies": company_counts["pending"],
                "inactive_companies": company_counts["inactive"],
            },
            "orders": recent_orders,
        }
    except OperationalError as e:
        logger.error(f"Error de BD al obtener admin dashboard: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )


@router.get("/orders/page", response_model=OrdersPageResponse)
def get_admin_orders_page(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin_with_retry(db, current_user)
    
    try:
        return OrderService.get_admin_orders_page(
            db=db,
            page=page,
            page_size=page_size,
            search=search,
            status=status,
        )
    except OperationalError as e:
        logger.error(f"Error de BD al obtener admin orders: {e}")
        raise HTTPException(
            status_code=503,
            detail="Servicio de base de datos temporalmente no disponible"
        )