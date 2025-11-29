"""
Security utilities
"""
from utils.jwt import decode_access_token

__all__ = ["verify_token"]


def verify_token(token: str) -> dict:
    """Verify a JWT token"""
    return decode_access_token(token)

