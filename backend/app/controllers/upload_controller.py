from fastapi import APIRouter, UploadFile, File, HTTPException, status
from uuid import uuid4
from app.providers.supabase_provider import supabase_admin
from app.config.settings import settings

router = APIRouter(tags=["Upload"])

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid4()}.{file_ext}"

        # 🔥 IMPORTANTE: debe cumplir RLS
        company_id = 1  # luego dinámico
        file_path = f"{company_id}/temp/{file_name}"

        contents = await file.read()

        BUCKET_NAME = "order-references"

        supabase_admin.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=contents,
            file_options={"content-type": file.content_type}
        )

        # 🔥 usar signed URL porque es privado
        signed_url = supabase_admin.storage.from_(BUCKET_NAME).create_signed_url(
            file_path,
            3600
        )

        return {
            "url": signed_url["signedURL"]
        }

    except Exception as e:
        print("ERROR UPLOAD:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al subir la imagen",
        )


@router.post("/upload-product-image")
async def upload_product_image(file: UploadFile = File(...)):
    try:
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid4()}.{file_ext}"

        company_id = 1
        file_path = f"{company_id}/products/{file_name}"

        contents = await file.read()

        bucket_name = "product-catalog"

        supabase_admin.storage.from_(bucket_name).upload(
            path=file_path,
            file=contents,
            file_options={"content-type": file.content_type}
        )

        public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"

        return {
            "bucket": bucket_name,
            "storage_path": file_path,
            "url": public_url,
        }

    except Exception as e:
        print("ERROR UPLOAD PRODUCT:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al subir imagen de producto",
        )