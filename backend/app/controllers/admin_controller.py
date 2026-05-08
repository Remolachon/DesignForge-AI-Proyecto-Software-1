from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.security.token_validator import get_current_user
from app.schemas.order_schema import OrdersPageResponse
from app.services.company_service import CompanyService
from app.services.order_service import OrderService
from app.services.user_service import UserService

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(db: Session, current_user):
    db_user = db.query(User).filter(User.supabase_id == current_user.id).first()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no existe en DB")

    role_name = UserService.get_user_role_name(db, db_user.id)
    if role_name != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    return db_user


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin(db, current_user)

    order_data = OrderService.get_dashboard_data(db=db, user_id=0, role_name="funcionario")
    recent_orders = order_data["orders"][:3]
    company_counts = CompanyService.get_admin_company_counts(db)
    total_users = db.query(User).filter(User.is_active == True).count()

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


@router.get("/orders/page", response_model=OrdersPageResponse)
def get_admin_orders_page(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin(db, current_user)
    return OrderService.get_admin_orders_page(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
    )