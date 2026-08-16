from api.auth import router as auth_router
from api.routes import router as base_router
from fastapi import FastAPI

app = FastAPI()
app.include_router(base_router)
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
