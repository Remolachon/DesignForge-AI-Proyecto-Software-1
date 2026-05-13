from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import datetime, timedelta
from app.schemas.product_schema import ProductResponse, AdminProductResponse, AdminProductUpsertRequest, FileAssetResponse
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
    def _build_public_image(storage_path: str | None, bucket_name: str | None = None) -> str | None:
        if not storage_path:
            return None
        if storage_path.startswith("http"):
            return storage_path
        bucket = bucket_name or "product-catalog"
        return f"{SUPABASE_PUBLIC_URL}/{bucket}/{storage_path}"

    @staticmethod
    def _serialize_admin_product(row, file_assets=None) -> AdminProductResponse:
        file_assets = file_assets or []
        media_responses = []
        image_url = None

        # sort assets by sort_order
        file_assets.sort(key=lambda x: x.sort_order if x.sort_order is not None else 0)

        for a in file_assets:
            url = ProductService._build_public_image(a.storage_path, a.bucket_name)
            if url:
                media_responses.append(FileAssetResponse(
                    id=a.id,
                    storage_path=url,
                    media_kind=a.media_kind,
                    media_role=a.media_role,
                    sort_order=a.sort_order,
                    file_type=a.file_type,
                    mime_type=a.mime_type,
                    size_bytes=a.size_bytes,
                    width=a.width,
                    height=a.height,
                    duration_seconds=a.duration_seconds,
                    extension=a.extension
                ))
                if a.media_role == 'main':
                    image_url = url
                # Legacy fallback
                elif a.file_type == 'product_main' and not image_url:
                    image_url = url

        if not image_url and media_responses:
            image_url = media_responses[0].storage_path
            
        # Legacy single image fallback from query if media is empty
        if not image_url and hasattr(row, 'storage_path') and row.storage_path:
            image_url = ProductService._build_public_image(row.storage_path)

        company_id = getattr(row, 'company_id', None)

        return AdminProductResponse(
            id=row.id,
            companyId=company_id,
            name=row.name,
            description=row.description,
            basePrice=float(row.base_price),
            productType=row.product_type,
            imageUrl=image_url,
            media=media_responses,
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
                Product.company_id,
                Product.name,
                Product.description,
                Product.base_price,
                Product.is_active,
                Product.is_public,
                ProductType.name.label("product_type"),
                Inventory.quantity,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("review_count"),
            )
            .join(ProductType, Product.product_type_id == ProductType.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(Review, Product.id == Review.product_id)
            .filter(Product.is_active == True)
            .filter(Product.is_public == True)
            .group_by(
                Product.id,
                Product.company_id,
                ProductType.name,
                Inventory.quantity,
            )
            .all()
        )

        product_ids = [r.id for r in results]
        assets = db.query(FileAsset).filter(FileAsset.product_id.in_(product_ids), FileAsset.is_active == True).all()
        assets_map = {pid: [] for pid in product_ids}
        for a in assets:
            assets_map[a.product_id].append(a)

        products = []
        for row in results:
            admin_resp = ProductService._serialize_admin_product(row, assets_map.get(row.id, []))
            products.append(ProductResponse(
                id=admin_resp.id,
                title=admin_resp.name,
                description=admin_resp.description,
                imageUrl=admin_resp.imageUrl,
                media=admin_resp.media,
                price=admin_resp.basePrice,
                rating=admin_resp.rating,
                reviews=admin_resp.reviews,
                inStock=admin_resp.inStock,
                productType=admin_resp.productType
            ))

        return products

    @staticmethod
    def get_admin_products(db: Session, company_id: int | None = None):
        query = (
            db.query(
                Product.id,
                Product.company_id,
                Product.name,
                Product.description,
                Product.base_price,
                Product.is_active,
                Product.is_public,
                ProductType.name.label("product_type"),
                Inventory.quantity,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("review_count"),
            )
            .join(ProductType, Product.product_type_id == ProductType.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(Review, Product.id == Review.product_id)
            .filter(Product.is_active == True)
        )

        if company_id is not None:
            query = query.filter(Product.company_id == company_id)

        rows = query.group_by(
            Product.id,
            Product.company_id,
            ProductType.name,
            Inventory.quantity,
        ).all()
        
        product_ids = [r.id for r in rows]
        assets = db.query(FileAsset).filter(FileAsset.product_id.in_(product_ids), FileAsset.is_active == True).all()
        assets_map = {pid: [] for pid in product_ids}
        for a in assets:
            assets_map[a.product_id].append(a)

        return [ProductService._serialize_admin_product(row, assets_map.get(row.id, [])) for row in rows]

    @staticmethod
    def get_admin_products_page(db: Session, company_id: int | None = None, page: int = 1, page_size: int = 20, search: str | None = None):
        query = (
            db.query(
                Product.id,
                Product.company_id,
                Product.name,
                Product.description,
                Product.base_price,
                Product.is_active,
                Product.is_public,
                ProductType.name.label("product_type"),
                Inventory.quantity,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("review_count"),
            )
            .join(ProductType, Product.product_type_id == ProductType.id)
            .outerjoin(Inventory, Product.id == Inventory.product_id)
            .outerjoin(Review, Product.id == Review.product_id)
        )

        if company_id is not None:
            query = query.filter(Product.company_id == company_id)

        if search:
            term = f"%{search.strip()}%"
            query = query.filter((Product.name.ilike(term)) | (Product.description.ilike(term)))

        query = query.filter(Product.is_active == True)

        count_q = db.query(func.count(func.distinct(Product.id)))
        count_q = count_q.join(ProductType, Product.product_type_id == ProductType.id)
        count_q = count_q.outerjoin(Inventory, Product.id == Inventory.product_id)
        count_q = count_q.outerjoin(Review, Product.id == Review.product_id)

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
                Product.company_id,
                ProductType.name,
                Inventory.quantity,
            )
            .offset(offset)
            .limit(safe_page_size)
            .all()
        )
        
        product_ids = [r.id for r in rows]
        assets = db.query(FileAsset).filter(FileAsset.product_id.in_(product_ids), FileAsset.is_active == True).all()
        assets_map = {pid: [] for pid in product_ids}
        for a in assets:
            assets_map[a.product_id].append(a)

        items = [ProductService._serialize_admin_product(row, assets_map.get(row.id, [])) for row in rows]

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

        if payload.imageStoragePath:
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

        if payload.imageStoragePath:
            # We don't necessarily delete the rest, just the legacy main image maybe
            # However with the new architecture, frontend might not send imageStoragePath anymore
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

    @staticmethod
    def upload_product_media(
        db: Session,
        product_id: int,
        company_id: int,
        user_id: int,
        media_kind: str,
        media_role: str,
        sort_order: int,
        file: bytes,
        filename: str,
        content_type: str,
    ) -> FileAssetResponse:
        product_query = db.query(Product).filter(Product.id == product_id)
        if company_id:
            product_query = product_query.filter(Product.company_id == company_id)

        product = product_query.first()
        if not product or not product.is_active:
            raise ValueError("Producto no encontrado")

        from app.providers.supabase_provider import supabase_admin
        from uuid import uuid4

        file_ext = filename.split(".")[-1] if "." in filename else ""
        uuid_name = f"{uuid4()}.{file_ext}"

        file_path = f"companies/{company_id}/products/{product_id}/{uuid_name}"
        bucket_name = "product-catalog"

        try:
            supabase_admin.storage.from_(bucket_name).upload(
                path=file_path,
                file=file,
                file_options={"content-type": content_type}
            )
        except Exception as e:
            print("ERROR UPLOAD PRODUCT MEDIA:", e)
            raise ValueError("Error al subir el archivo a Storage")
        
        from app.config.settings import settings
        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"

        new_asset = FileAsset(
            bucket_name=bucket_name,
            storage_path=public_url,
            file_type=None,
            mime_type=content_type,
            size_bytes=len(file),
            sort_order=sort_order,
            product_id=product_id,
            media_kind=media_kind,
            media_role=media_role,
            extension=file_ext,
            is_active=True,
            uploaded_by=user_id,
        )
        db.add(new_asset)
        db.commit()

        return FileAssetResponse(
            id=new_asset.id,
            storage_path=public_url,
            media_kind=media_kind,
            media_role=media_role,
            sort_order=sort_order,
            file_type=None,
            mime_type=content_type,
            size_bytes=len(file),
            width=None,
            height=None,
            duration_seconds=None,
            extension=file_ext,
        )