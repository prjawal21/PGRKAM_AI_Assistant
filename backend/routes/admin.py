"""
Admin utilities (temporary routes for development)
"""
from fastapi import APIRouter, HTTPException, status
from db import users_collection

router = APIRouter()


@router.delete("/admin/cleanup-users")
async def cleanup_users():
    """
    TEMPORARY: Clean up all users from database
    WARNING: This will delete all users!
    Use only for development/testing.
    """
    result = await users_collection.delete_many({})
    return {
        "message": "Users collection cleaned",
        "deleted_count": result.deleted_count
    }
