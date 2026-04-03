from sqlalchemy.orm import Session
from sqlalchemy import func
from app.schemas.product_schema import ProductResponse
from app.models.product import Product
from app.models.product_type import ProductType
from app.models.inventory import Inventory
from app.models.review import Review
from app.models.file_assets import FileAsset

SUPABASE_PUBLIC_URL = "https://ttfwjexqplbbcfdfhxsg.supabase.co/storage/v1/object/public"

class ProductService:

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