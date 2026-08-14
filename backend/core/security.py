from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

ph = PasswordHasher()


def hash_password(user_password: str) -> str:
    return ph.hash(user_password)


def verify_password(user_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, user_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(hashed_password: str) -> bool:
    return ph.check_needs_rehash(hashed_password)
