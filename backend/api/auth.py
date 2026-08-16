from typing import Annotated

from core.schemas import UserLogin, UserRegister, UserResponse
from core.security import hash_password, needs_rehash, verify_password
from database.models import User
from database.session import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_input: UserRegister, db: Annotated[AsyncSession, Depends(get_db)]):
    # Check if email exists, then hash password
    query = select(User).where(User.email == user_input.email)
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    hashed_password = hash_password(user_input.password)

    # Strip raw password input, then save new User row
    stripped_user_data = user_input.model_dump(exclude={"password"})
    new_user = User(**stripped_user_data, password_hash=hashed_password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=UserResponse)
async def read_user(credentials: UserLogin, db: Annotated[AsyncSession, Depends(get_db)]):
    # Custom exception for invalid credentials
    invalid_credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Check if email exists, then check if user has password (not logging in with Google)
    query = select(User).where(User.email == credentials.email)
    result = await db.execute(query)
    found_user = result.scalars().first()
    if not found_user or not found_user.password_hash:
        raise invalid_credentials_exception

    # Verify password matches with hashed password
    is_verified = verify_password(credentials.password, found_user.password_hash)
    if not is_verified:
        raise invalid_credentials_exception

    # Check if password hash parameters are updated
    if needs_rehash(found_user.password_hash):
        found_user.password_hash = hash_password(credentials.password)
        await db.commit()

    return found_user
