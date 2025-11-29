"""
API routes module
"""
from fastapi import APIRouter
from .auth import router as auth_router
from .chat import router as chat_router
from .user import router as user_router
from .admin import router as admin_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(chat_router, tags=["chat"])
api_router.include_router(user_router, tags=["user"])
api_router.include_router(admin_router, tags=["admin"])

__all__ = ["api_router"]

