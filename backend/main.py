from contextlib import asynccontextmanager

from api.auth import router as auth_router
from api.folders import router as folder_router
from api.routes import router as base_router
from fastapi import FastAPI
from storage.client import ensure_bucket_exists


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application startup and shutdown events."""
    ensure_bucket_exists()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(base_router)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(folder_router, prefix="/folders")
