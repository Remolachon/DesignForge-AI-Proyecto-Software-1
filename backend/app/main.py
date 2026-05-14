import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models
from app.controllers.user_controller import router as user_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.admin_controller import router as admin_router
from app.controllers.company_controller import router as company_router
from app.controllers import product_controller
from app.controllers import order_controller
from app.controllers import interaction_controller
from app.controllers import upload_controller
from app.controllers import ai_controller
from app.database.database import check_db_connection

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Iniciando servidor...")
    
    # Verificar conexión a BD
    db_available = await check_db_connection()
    if not db_available:
        logger.warning("⚠️  Advertencia: No se pudo verificar conexión a BD al iniciar")
    else:
        logger.info("✅ Conexión a BD verificada")
    
    yield
    
    # Shutdown
    logger.info("🛑 Deteniendo servidor...")

app = FastAPI(
    title="Embroidery Marketplace API",
    description="API para gestionar marketplace de bordados",
    lifespan=lifespan
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://design-forge-ai-proyecto-software-1-yizbuk3r1.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

extra_origins = os.getenv("CORS_ORIGINS", "")
if extra_origins:
    origins.extend([origin.strip().rstrip("/") for origin in extra_origins.split(",") if origin.strip()])

# Deduplicate while preserving order
origins = list(dict.fromkeys(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(company_router)
app.include_router(product_controller.router)
app.include_router(order_controller.router)
app.include_router(interaction_controller.router)
app.include_router(upload_controller.router)
app.include_router(ai_controller.router)


@app.get("/")
def root():
    return {"message": "Bienvenido a Embroidery Marketplace API"}


@app.get("/health")
async def health_check():
    """
    Endpoint para verificar salud de la aplicación.
    Incluye estado de la conexión a BD.
    """
    db_available = await check_db_connection()
    
    return {
        "status": "healthy" if db_available else "degraded",
        "database": "connected" if db_available else "disconnected",
    }
    return {"message": "API running"}