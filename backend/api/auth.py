from typing import Annotated

from core.config import settings
from core.schemas import MessageResponse, UserLogin, UserRegister, UserResponse
from core.security import hash_password, needs_rehash, verify_password
from core.tokens import create_access_token, create_refresh_token, verify_and_decode_token
from database.models import User
from database.session import get_db
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

COOKIE_SECURITY_FLAGS = {
    "httponly": True,
    "secure": True,
    "samesite": "lax",
}


def _set_auth_cookies(response: Response, user_id: int) -> None:
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        **COOKIE_SECURITY_FLAGS,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        **COOKIE_SECURITY_FLAGS,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/auth/refresh",
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_input: UserRegister, response: Response, db: Annotated[AsyncSession, Depends(get_db)]):
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

    # After successful verification, create tokens, and set cookies with the created tokens
    _set_auth_cookies(response, new_user.id)

    return new_user


@router.post("/login", response_model=UserResponse)
async def read_user(credentials: UserLogin, response: Response, db: Annotated[AsyncSession, Depends(get_db)]):
    # Custom exception for invalid credentials
    invalid_credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
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

    # After successful verification, create tokens, and set cookies with the created tokens
    _set_auth_cookies(response, found_user.id)

    # Check if password hash parameters are updated
    if needs_rehash(found_user.password_hash):
        found_user.password_hash = hash_password(credentials.password)
        await db.commit()

    return found_user


@router.post("/refresh", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def refresh_access_token(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: Annotated[str | None, Cookie()] = None,
):
    # Check if refresh_token is not missing
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing.")

    # Verify token is of type "refresh"
    try:
        payload = verify_and_decode_token(refresh_token, expected_type="refresh")
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(err)) from err

    # Confirm user is active in database
    query = select(User).where(User.id == int(payload.sub))
    result = await db.execute(query)
    found_user = result.scalars().first()
    if not found_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account does not exist.")

    # After successful verification, create tokens, and set cookies with the created tokens
    _set_auth_cookies(response, found_user.id)

    return MessageResponse(msg="Refreshed")


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/", **COOKIE_SECURITY_FLAGS)
    response.delete_cookie(key="refresh_token", path="/auth/refresh", **COOKIE_SECURITY_FLAGS)
    return MessageResponse(msg="Logged out")
