from typing import Annotated

from core.deps import get_current_user
from database.models import User
from fastapi import APIRouter, Depends

router = APIRouter()


@router.get("/")
def read_root():
    return {"Hello": "World"}


@router.get("/me")
async def read_current_user(current_user: Annotated[User, Depends(get_current_user)]):
    return {"id": current_user.id, "email": current_user.email}
