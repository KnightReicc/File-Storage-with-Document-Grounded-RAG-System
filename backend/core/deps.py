from typing import Annotated

from core.tokens import verify_and_decode_token
from database.models import User
from database.session import get_db
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    access_token: Annotated[str | None, Cookie()] = None,
) -> User:
    # Check if access_token exists
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing")

    # Verify and decode access_token
    try:
        payload = verify_and_decode_token(access_token, expected_type="access")
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(err)) from err

    # Search for the current user using payload 'sub' field
    query = select(User).where(User.id == int(payload.sub))
    result = await db.execute(query)
    found_user = result.scalars().first()

    # Verify user exists
    if not found_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account does not exist.")

    return found_user
