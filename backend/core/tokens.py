from datetime import datetime as dt
from datetime import timedelta, timezone
from typing import Literal

import jwt
from core.config import settings
from pydantic import BaseModel, ValidationError, field_validator


class TokenPayload(BaseModel):
    sub: str
    type: Literal["access", "refresh"]

    @field_validator("sub")
    @classmethod
    def sub_must_be_numeric(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("sub field must be a numeric user id.")
        return v


def _create_token(sub: int | str, token_type: str, expires_delta: timedelta) -> str:
    now = dt.now(timezone.utc)
    payload = {
        "sub": str(sub),
        "type": token_type,
        "exp": now + expires_delta,
        "iat": now,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user_id: int | str) -> str:
    return _create_token(user_id, "access", timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(user_id: int | str) -> str:
    return _create_token(user_id, "refresh", timedelta(days=settings.refresh_token_expire_days))


def verify_and_decode_token(token: str, expected_type: str = "access") -> TokenPayload:
    try:
        # Decodes and validates token field data types
        decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        token_payload = TokenPayload(**decoded)

    # Catches expired, invalid, and bad tokens
    except jwt.ExpiredSignatureError as err:
        raise ValueError("Token has expired.") from err
    except (jwt.PyJWTError, ValidationError) as err:
        raise ValueError("Token signature or structure is invalid.") from err

    # Checks token payload type
    if token_payload.type != expected_type:
        raise ValueError(f'Invalid token type, expected "{expected_type}" token.')

    return token_payload
