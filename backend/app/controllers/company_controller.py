from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.company_schema import (
    CompanyCreateRequest,
    CompanyResponse,
    CompanyStatusUpdateRequest,
    CompanyAdminResponse,
)
from app.security.token_validator import get_current_user
from app.services.company_service import CompanyService
from app.services.user_service import UserService

router = APIRouter(prefix="/companies", tags=["Companies"])


def _get_or_create_db_user(db: Session, current_user):
    db_user = UserService.get_user_by_supabase_id(db, current_user.id)

    if db_user is None:
        metadata = current_user.user_metadata or {}
        db_user = UserService.create_user(
            db,
            email=current_user.email,
            first_name=metadata.get("first_name", ""),
            last_name=metadata.get("last_name", ""),
            phone=metadata.get("phone"),
            supabase_id=current_user.id,
        )
        UserService.assign_default_role(db, db_user.id)

    return db_user


def _require_admin(db: Session, current_user):
    db_user = _get_or_create_db_user(db, current_user)
    role_name = UserService.get_user_role_name(db, db_user.id)

    if role_name != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado")

    return db_user


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_user = _get_or_create_db_user(db, current_user)

    company = CompanyService.create_company(
        db=db,
        payload=payload,
        created_by_user=db_user,
    )
    return company


@router.get("/admin", response_model=list[CompanyAdminResponse])
def get_admin_companies(
    filter_status: str = Query("all", alias="filter"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin(db, current_user)
    return CompanyService.get_admin_companies(db, filter_status=filter_status)


@router.get("/admin/counts")
def get_admin_company_counts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin(db, current_user)
    return CompanyService.get_admin_company_counts(db)


@router.put("/{company_id}/status", response_model=CompanyResponse)
@router.patch("/{company_id}/status", response_model=CompanyResponse)
def update_company_status(
    company_id: int,
    payload: CompanyStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin(db, current_user)

    try:
        return CompanyService.update_company_status(
            db=db,
            company_id=company_id,
            status_value=payload.status,
        )
    except HTTPException:
        raise


@router.delete("/{company_id}", response_model=CompanyResponse)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_admin(db, current_user)
    return CompanyService.delete_company(db, company_id)