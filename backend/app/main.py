from fastapi import FastAPI
from app.controllers.user_controller import router as user_router
from app.controllers.auth_controller import router as auth_router

app = FastAPI(title="Embroidery Marketplace API")

app.include_router(user_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "API running"}