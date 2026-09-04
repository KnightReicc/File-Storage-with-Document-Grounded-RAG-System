from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class EmailNormalizedBase(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower()


class UserRegister(EmailNormalizedBase):
    password: str = Field(min_length=8, max_length=128, description="Plaintext password from user")


class UserLogin(EmailNormalizedBase):
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    created_at: datetime


class MessageResponse(BaseModel):
    msg: str
