from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.user import User
from app.schemas.company_schema import CompanyCreateRequest, CompanyAdminResponse
from app.services.user_service import UserService


class CompanyService:

    @staticmethod
    def _now_local() -> datetime:
        return datetime.utcnow() - timedelta(hours=5)

    @staticmethod
    def _normalize_text(value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None

    @staticmethod
    def _normalize_required(value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hay campos vacíos",
            )

        return normalized

    @staticmethod
    def create_company(
        db: Session,
        payload: CompanyCreateRequest,
        created_by_user: User,
    ) -> Company:
        nit = CompanyService._normalize_required(payload.nit)
        name = CompanyService._normalize_required(payload.name)
        email = CompanyService._normalize_required(created_by_user.email)
        description = CompanyService._normalize_text(payload.description)
        address = CompanyService._normalize_text(payload.address)
        phone = CompanyService._normalize_text(payload.phone)
        start_date = payload.start_date or CompanyService._now_local()

        existing_nit = db.query(Company).filter(Company.nit == nit).first()
        if existing_nit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El NIT ya existe",
            )

        existing_email = db.query(Company).filter(Company.email == email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya existe",
            )

        company = Company(
            nit=nit,
            name=name,
            description=description,
            address=address,
            phone=phone,
            email=email,
            start_date=start_date,
            status="PENDING",
            is_active=False,
            created_by_user_id=created_by_user.id,
        )

        try:
            db.add(company)
            db.commit()
            db.refresh(company)
            return company
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo crear la empresa",
            )

    @staticmethod
    def update_company_status(
        db: Session,
        company_id: int,
        status_value: str,
    ) -> Company:
        company = db.query(Company).filter(Company.id == company_id).first()

        if company is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada",
            )

        normalized_status = CompanyService._normalize_required(status_value).upper()
        previous_status = (company.status or "").upper()
        was_active = bool(company.is_active)

        company.status = normalized_status

        if normalized_status == "APPROVED":
            company.is_active = True
        elif normalized_status in {"REJECTED", "INACTIVE", "DELETED"}:
            company.is_active = False

        if normalized_status == "APPROVED" and (previous_status != "APPROVED" or not was_active):
            creator = db.query(User).filter(User.id == company.created_by_user_id).first()

            if creator is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario creador no encontrado",
                )

            UserService.set_user_company(
                db,
                user_id=creator.id,
                company_id=company.id,
                commit=False,
            )
            UserService.set_user_role(
                db,
                user_id=creator.id,
                role_name="funcionario",
                commit=False,
            )

        db.commit()
        db.refresh(company)

        return company

    @staticmethod
    def delete_company(
        db: Session,
        company_id: int,
    ) -> Company:
        company = db.query(Company).filter(Company.id == company_id).first()

        if company is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa no encontrada",
            )

        creator = db.query(User).filter(User.id == company.created_by_user_id).first()
        if creator is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario creador no encontrado",
            )

        company.is_active = False
        company.status = "APPROVED"
        UserService.set_user_company(db, creator.id, None, commit=False)
        UserService.set_user_role(db, creator.id, "cliente", commit=False)

        db.commit()
        db.refresh(company)
        return company

    @staticmethod
    def get_admin_companies(db: Session, filter_status: str | None = None) -> list[CompanyAdminResponse]:
        query = (
            db.query(Company, User.first_name, User.last_name)
            .join(User, Company.created_by_user_id == User.id)
            .order_by(Company.start_date.desc())
        )

        normalized = (filter_status or "all").lower().strip()
        if normalized == "pending":
            query = query.filter(Company.status == "PENDING")
        elif normalized == "active":
            query = query.filter(Company.is_active == True, Company.status == "APPROVED")
        elif normalized == "inactive":
            query = query.filter(
                or_(
                    and_(Company.status == "APPROVED", Company.is_active == False),
                    Company.status == "INACTIVE",
                )
            )

        rows = query.all()
        results: list[CompanyAdminResponse] = []

        for company, first_name, last_name in rows:
            results.append(
                CompanyAdminResponse(
                    id=company.id,
                    nit=company.nit,
                    name=company.name,
                    description=company.description,
                    address=company.address,
                    phone=company.phone,
                    email=company.email,
                    start_date=company.start_date,
                    status=company.status,
                    is_active=bool(company.is_active),
                    created_by_user_id=company.created_by_user_id,
                    created_by_user_name=f"{first_name} {last_name}".strip(),
                )
            )

        return results

    @staticmethod
    def get_admin_company_counts(db: Session) -> dict[str, int]:
        total = db.query(Company).count()
        pending = db.query(Company).filter(Company.status == "PENDING").count()
        active = db.query(Company).filter(Company.status == "APPROVED", Company.is_active == True).count()
        inactive = db.query(Company).filter(
            or_(
                and_(Company.status == "APPROVED", Company.is_active == False),
                Company.status == "INACTIVE",
            )
        ).count()

        return {
            "total": total,
            "pending": pending,
            "active": active,
            "inactive": inactive,
        }