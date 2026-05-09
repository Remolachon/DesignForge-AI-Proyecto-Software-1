from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.schemas.product_schema import ProductResponse, AdminProductResponse, AdminProductUpsertRequest
from app.models.product import Product
from app.models.product_type import ProductType
from app.models.inventory import Inventory
from app.models.review import Review
from app.models.file_assets import FileAsset

SUPABASE_PUBLIC_URL = "https://ttfwjexqplbbcfdfhxsg.supabase.co/storage/v1/object/public"

class ProductService:

    @staticmethod
    def _now_local_iso() -> str:
        return (datetime.utcnow() - timedelta(hours=5)).date().isoformat()

    @staticmethod
    def _normalize_type_name(value: str) -> str:
        return (value or "").strip().lower().replace("-", " ")

    @staticmethod
    def _resolve_product_type(db: Session, product_type: str) -> ProductType | None:
        target = ProductService._normalize_type_name(product_type)

        all_types = db.query(ProductType).all()
        for item in all_types:
            if ProductService._normalize_type_name(item.name) == target:
                return item

        return None

    @staticmethod
    def _build_public_image(storage_path: str | None) -> str | None:
        if not storage_path:
            return None

        return f"{SUPABASE_PUBLIC_URL}/product-catalog/{storage_path}"

    @staticmethod
    def _serialize_admin_product(row) -> AdminProductResponse:
        image_url = ProductService._build_public_image(row.storage_path)

        return AdminProductResponse(
            id=row.id,
            name=row.name,
            description=row.description,
            basePrice=float(row.base_price),
            productType=row.product_type,
            imageUrl=image_url,
            inStock=(row.quantity or 0) > 0,
            stock=int(row.quantity or 0),
            isActive=bool(row.is_active),
            isPublic=bool(row.is_public),
            rating=float(row.avg_rating) if row.avg_rating else 0,
            reviews=row.review_count,
            createdAt=ProductService._now_local_iso(),
        )

    @staticmethod
    def get_products(db: Session):
        results = (
            db.query(
            Product.id,
            Product.name,
            Product.description,
            Product.base_price,
            ProductType.name.label("product_type"),
            Inventory.quantity,
            func.avg(Review.rating).label("avg_rating"),
            func.count(Review.id).label("review_count"),
            FileAsset.storage_path
        )
        .join(ProductType, Product.product_type_id == ProductType.id)
        .join(Inventory, Product.id == Inventory.product_id)
        .outerjoin(Review, Product.id == Review.product_id)
        .outerjoin(
            FileAsset,
            (FileAsset.product_id == Product.id) &
            (FileAsset.file_type == 'product_main') &
            (FileAsset.is_active == True)
        )
        .filter(Product.is_active == True)
        .filter(Product.is_public == True)
        .group_by(
            Product.id,
            ProductType.name,
            Inventory.quantity,
            FileAsset.storage_path
        )
            .all()
        )

        products = []

        for row in results:
            image_url = None
            if row.storage_path:
                image_url = f"{SUPABASE_PUBLIC_URL}/product-catalog/{row.storage_path}"

            products.append(ProductResponse(
                id=row.id,
                title=row.name,
                description=row.description,
                imageUrl=image_url,
                price=float(row.base_price),
                rating=float(row.avg_rating) if row.avg_rating else 0,
                reviews=row.review_count,
                inStock=row.quantity > 0,
                productType=row.product_type
            ))

        return products

    @staticmethod
    def get_admin_products(db: Session, company_id: int | None = None):
        query = (
            db.query(
                Product.id,
                Product.name,
                Product.description,
                Product.base_price,
                Product.is_active,
                Product.is_public,
                ProductType.name.label("product_type"),
                Inventory.quantity,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("review_count"),
                FileAsset.storage_path,
            )
            .join(ProductType, Product.product_type_id == ProductType.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(Review, Product.id == Review.product_id)
            .outerjoin(
                FileAsset,
                (FileAsset.product_id == Product.id)
                & (FileAsset.file_type == "product_main")
                & (FileAsset.is_active == True),
            )
            .filter(Product.is_active == True)
        )

        if company_id is not None:
            query = query.filter(Product.company_id == company_id)

        rows = query.group_by(
            Product.id,
            ProductType.name,
            Inventory.quantity,
            FileAsset.storage_path,
        ).all()

        return [ProductService._serialize_admin_product(row) for row in rows]

    @staticmethod
    def get_admin_products_page(db: Session, company_id: int | None = None, page: int = 1, page_size: int = 20, search: str | None = None):
        query = (
            db.query(
                Product.id,
                Product.name,
                Product.description,
                Product.base_price,
                Product.is_active,
                Product.is_public,
                ProductType.name.label("product_type"),
                Inventory.quantity,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("review_count"),
                FileAsset.storage_path,
            )
            .join(ProductType, Product.product_type_id == ProductType.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(Review, Product.id == Review.product_id)
            .outerjoin(
                FileAsset,
                (FileAsset.product_id == Product.id)
                & (FileAsset.file_type == "product_main")
                & (FileAsset.is_active == True),
            )
        )

        if company_id is not None:
            query = query.filter(Product.company_id == company_id)

        if search:
            term = f"%{search.strip()}%"
            query = query.filter((Product.name.ilike(term)) | (Product.description.ilike(term)))

        query = query.filter(Product.is_active == True)

        # Calcular total usando una consulta separada con COUNT(DISTINCT products.id)
        count_q = db.query(func.count(func.distinct(Product.id)))
        count_q = count_q.join(ProductType, Product.product_type_id == ProductType.id)
        count_q = count_q.outerjoin(Inventory, Product.id == Inventory.product_id)
        count_q = count_q.outerjoin(Review, Product.id == Review.product_id)
        count_q = count_q.outerjoin(
            FileAsset,
            (FileAsset.product_id == Product.id)
            & (FileAsset.file_type == "product_main")
            & (FileAsset.is_active == True),
        )

        if company_id is not None:
            count_q = count_q.filter(Product.company_id == company_id)

        if search:
            term = f"%{search.strip()}%"
            count_q = count_q.filter((Product.name.ilike(term)) | (Product.description.ilike(term)))

        count_q = count_q.filter(Product.is_active == True)

        total = int(count_q.scalar() or 0)
        safe_page = max(1, page)
        safe_page_size = max(1, min(page_size, 100))
        offset = (safe_page - 1) * safe_page_size

        rows = (
            query.group_by(
                Product.id,
                ProductType.name,
                Inventory.quantity,
                FileAsset.storage_path,
            )
            .offset(offset)
            .limit(safe_page_size)
            .all()
        )

        items = [ProductService._serialize_admin_product(row) for row in rows]

        return {
            "items": items,
            "page": safe_page,
            "pageSize": safe_page_size,
            "totalItems": total,
            "totalPages": max(1, (total + safe_page_size - 1) // safe_page_size),
        }

    @staticmethod
    def create_admin_product(
        db: Session,
        payload: AdminProductUpsertRequest,
        company_id: int,
        created_by_user_id: int,
    ):
        product_type = ProductService._resolve_product_type(db, payload.productType)
        if not product_type:
            raise ValueError("Tipo de producto inválido")

        if not payload.imageStoragePath:
            raise ValueError("La imagen del producto es obligatoria")

        product = Product(
            company_id=company_id,
            product_type_id=product_type.id,
            created_by_user_id=created_by_user_id,
            name=payload.name.strip(),
            description=payload.description.strip(),
            base_price=payload.basePrice,
            is_public=True,
            is_active=True,
        )
        db.add(product)
        db.flush()

        product_asset = FileAsset(
            bucket_name="product-catalog",
            storage_path=payload.imageStoragePath,
            file_type="product_main",
            product_id=product.id,
            is_active=True,
        )
        db.add(product_asset)

        inventory = Inventory(product_id=product.id, quantity=max(0, payload.stock))
        db.add(inventory)
        db.commit()

        rows = ProductService.get_admin_products(db, company_id=company_id)
        for row in rows:
            if row.id == product.id:
                return row

        raise ValueError("No fue posible crear el producto")

    @staticmethod
    def update_admin_product(
        db: Session,
        product_id: int,
        payload: AdminProductUpsertRequest,
        company_id: int | None = None,
    ):
        product_query = db.query(Product).filter(Product.id == product_id)
        if company_id is not None:
            product_query = product_query.filter(Product.company_id == company_id)

        product = product_query.first()
        if not product or not product.is_active:
            raise ValueError("Producto no encontrado")

        product_type = ProductService._resolve_product_type(db, payload.productType)
        if not product_type:
            raise ValueError("Tipo de producto inválido")

        product.name = payload.name.strip()
        product.description = payload.description.strip()
        product.base_price = payload.basePrice
        product.product_type_id = product_type.id

        existing_active_image = db.query(FileAsset).filter(
            FileAsset.product_id == product.id,
            FileAsset.file_type == "product_main",
            FileAsset.is_active == True,
        ).first()

        if not payload.imageStoragePath and not existing_active_image:
            raise ValueError("La imagen del producto es obligatoria")

        if payload.imageStoragePath:
            db.query(FileAsset).filter(
                FileAsset.product_id == product.id,
                FileAsset.file_type == "product_main",
                FileAsset.is_active == True,
            ).update({"is_active": False}, synchronize_session=False)

            new_asset = FileAsset(
                bucket_name="product-catalog",
                storage_path=payload.imageStoragePath,
                file_type="product_main",
                product_id=product.id,
                is_active=True,
            )
            db.add(new_asset)

        inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if not inventory:
            inventory = Inventory(product_id=product.id, quantity=max(0, payload.stock))
            db.add(inventory)
        else:
            inventory.quantity = max(0, payload.stock)

        db.commit()

        rows = ProductService.get_admin_products(db, company_id=company_id)
        for row in rows:
            if row.id == product.id:
                return row

        raise ValueError("No fue posible actualizar el producto")

    @staticmethod
    def set_product_visibility(
        db: Session,
        product_id: int,
        is_public: bool,
        company_id: int | None = None,
    ):
        product_query = db.query(Product).filter(Product.id == product_id)
        if company_id is not None:
            product_query = product_query.filter(Product.company_id == company_id)

        product = product_query.first()
        if not product or not product.is_active:
            raise ValueError("Producto no encontrado")

        product.is_public = is_public
        db.commit()

        rows = ProductService.get_admin_products(db, company_id=company_id)
        for row in rows:
            if row.id == product.id:
                return row

        raise ValueError("No fue posible actualizar visibilidad")

    @staticmethod
    def logical_delete_product(
        db: Session,
        product_id: int,
        company_id: int | None = None,
    ):
        product_query = db.query(Product).filter(Product.id == product_id)
        if company_id is not None:
            product_query = product_query.filter(Product.company_id == company_id)

        product = product_query.first()
        if not product:
            raise ValueError("Producto no encontrado")

        product.is_active = False
        db.commit()