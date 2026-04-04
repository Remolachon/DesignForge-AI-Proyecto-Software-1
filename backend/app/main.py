from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import app.models 

from app.controllers.user_controller import router as user_router
from app.controllers.auth_controller import router as auth_router
from app.controllers import product_controller
from app.controllers import order_controller
from app.controllers import upload_controller

app = FastAPI(title="Embroidery Marketplace API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RUTAS
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(product_controller.router)
app.include_router(order_controller.router)
app.include_router(upload_controller.router)

@app.get("/")
def root():
    return {"message": "API running"}