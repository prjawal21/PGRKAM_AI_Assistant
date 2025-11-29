"""
User profile routes
"""
from fastapi import APIRouter, Depends, HTTPException
from auth.dependencies import get_current_user
from typing import Dict, Any

router = APIRouter()


@router.get("/profile")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user's profile
    """
    # Remove sensitive data
    safe_user = {
        "user_id": str(current_user["_id"]),
        "name": current_user.get("name"),
        "email": current_user.get("email"),
        "profile": current_user.get("profile", {}),
        "created_at": current_user.get("created_at")
    }
    
    return safe_user


@router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update user profile
    """
    from db import users_collection
    from bson import ObjectId
    
    # Prepare update data
    update_data = {}
    
    # Update name if provided
    if "name" in profile_data:
        update_data["name"] = profile_data["name"]
    
    # Update profile if provided
    if "profile" in profile_data:
        update_data["profile"] = profile_data["profile"]
    
    # Convert user_id to ObjectId if it's a string
    user_id = current_user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    # Update profile in database
    print(f"Updating user {user_id} with data: {update_data}")
    result = await users_collection.update_one(
        {"_id": user_id},
        {"$set": update_data}
    )
    print(f"Update result: matched={result.matched_count}, modified={result.modified_count}")
    
    # Fetch the updated user from database
    updated_user = await users_collection.find_one({"_id": user_id})
    print(f"Fetched updated user: {updated_user is not None}")
    
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found after update")
    
    # Return updated profile data
    return {
        "success": True,
        "message": "Profile updated successfully",
        "user_id": str(updated_user["_id"]),
        "name": updated_user.get("name"),
        "email": updated_user.get("email"),
        "profile": updated_user.get("profile", {}),
        "created_at": updated_user.get("created_at")
    }


@router.delete("/account")
async def delete_account(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Delete current user's account permanently
    """
    from db import users_collection
    from bson import ObjectId
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Convert user_id to ObjectId if it's a string
    user_id = current_user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    logger.info(f"Deleting account for user: {user_id}")
    
    # Delete user from database
    result = await users_collection.delete_one({"_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    logger.info(f"Account deleted successfully: {user_id}")
    
    return {
        "success": True,
        "message": "Account deleted successfully"
    }
