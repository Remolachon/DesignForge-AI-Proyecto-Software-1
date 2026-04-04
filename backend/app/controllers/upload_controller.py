from fastapi import APIRouter, UploadFile, File
from uuid import uuid4
from app.providers.supabase_provider import supabase

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

        supabase.storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=contents,
            file_options={"content-type": file.content_type}
        )

        # 🔥 usar signed URL porque es privado
        signed_url = supabase.storage.from_(BUCKET_NAME).create_signed_url(
            file_path,
            3600
        )

        return {
            "url": signed_url["signedURL"]
        }

    except Exception as e:
        print("ERROR UPLOAD:", e)
        return {"error": str(e)}