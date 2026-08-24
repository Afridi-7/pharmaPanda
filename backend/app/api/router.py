from fastapi import APIRouter

from app.api.routes import auth, health, progress, simulations

# Aggregates every route module. Mounted once, under settings.API_PREFIX.
api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(simulations.router)
api_router.include_router(progress.router)
