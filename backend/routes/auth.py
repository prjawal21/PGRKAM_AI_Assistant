"""
Authentication routes - Register and Login
"""
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from db import users_collection
from models.auth import Token
from models.user import UserCreate
from utils.password import hash_password, verify_password
from utils.jwt import create_access_token
from auth.dependencies import get_current_user

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user
    
    Args:
        user_data: User registration data (name, email, password)
        
    Returns:
        Success message with user_id
        
    Raises:
        HTTPException: If email already exists or registration fails
    """
    # Normalize email to lowercase
    email = user_data.email.lower().strip()
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = hash_password(user_data.password)
    
    # Create user document
    user_doc = {
        "name": user_data.name.strip(),
        "email": email,
        "password": hashed_password,
        "profile": {},
        "created_at": datetime.utcnow()
    }
    
    # Insert into database
    try:
        result = await users_collection.insert_one(user_doc)
        
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        print(f"✅ REGISTER SUCCESS: User created with email={email}, id={result.inserted_id}")
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": str(result.inserted_id),
            "name": user_data.name
        }
        
    except Exception as e:
        print(f"❌ REGISTER ERROR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login and return user info
    
    Args:
        form_data: OAuth2 form with username (email) and password
        
    Returns:
        Success status with user_id and name
        
    Raises:
        HTTPException: If credentials are invalid
    """
    # Normalize email (username field contains email)
    email = form_data.username.lower().strip()
    
    print(f"🔐 LOGIN ATTEMPT: email={email}")
    
    # Find user by email
    user = await users_collection.find_one({"email": email})
    
    if not user:
        print(f"❌ LOGIN FAILED: User not found for email={email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    print(f"✓ User found: {user.get('name')}")
    
    # Get stored password hash
    stored_hash = user.get("password")
    
    if not stored_hash:
        print(f"❌ LOGIN FAILED: No password hash in database for email={email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    # Verify password
    try:
        is_valid = verify_password(form_data.password, stored_hash)
        print(f"🔑 Password verification: {is_valid}")
        
        if not is_valid:
            print(f"❌ LOGIN FAILED: Invalid password for email={email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or password"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ LOGIN ERROR: Password verification exception: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password"
        )
    
    # Create access token with user _id as subject
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    print(f"✅ LOGIN SUCCESS: Token created for email={email}, user_id={user['_id']}")
    
    return {
        "success": True,
        "user_id": str(user["_id"]),
        "name": user.get("name"),
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/forgot-password")
async def forgot_password(data: dict):
    """
    Request password reset - generates reset token
    
    For development: returns reset_url in response
    For production: would send email with reset link
    """
    email = data.get("email", "").lower().strip()
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    user = await users_collection.find_one({"email": email})
    
    # Always return success to prevent email enumeration
    if not user:
        return {
            "success": True,
            "message": "If the email exists, a reset link will be sent"
        }
    
    # Generate reset token
    from uuid import uuid4
    reset_token = uuid4().hex
    reset_expires = datetime.utcnow()
    from datetime import timedelta
    reset_expires = reset_expires + timedelta(hours=1)
    
    # Store token in user document
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": reset_expires
            }
        }
    )
    
    # For development: return reset URL
    # For production: send email instead
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    
    print(f"🔐 Password reset requested for {email}")
    print(f"Reset URL: {reset_url}")
    
    return {
        "success": True,
        "message": "Password reset link generated",
        "reset_url": reset_url,  # Remove this in production
        "note": "In production, this would be sent via email"
    }


@router.post("/reset-password")
async def reset_password(data: dict):
    """
    Reset password using token
    """
    token = data.get("token", "").strip()
    new_password = data.get("password", "")
    
    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and new password are required"
        )
    
    # Find user with valid token
    user = await users_collection.find_one({
        "reset_token": token,
        "reset_token_expires": {"$gt": datetime.utcnow()}
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Hash new password
    hashed_password = hash_password(new_password)
    
    # Update password and clear reset token
    await users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hashed_password},
            "$unset": {"reset_token": "", "reset_token_expires": ""}
        }
    )
    
    print(f"✅ Password reset successful for {user.get('email')}")
    
    return {
        "success": True,
        "message": "Password reset successfully"
    }


@router.post("/change-password")
async def change_password(data: dict, current_user: dict = Depends(get_current_user)):
    """
    Change password for authenticated user
    """
    from bson import ObjectId
    
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    
    if not current_password or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password and new password are required"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Convert user_id to ObjectId if it's a string
    user_id = current_user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    # Get user from database
    user = await users_collection.find_one({"_id": user_id})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not verify_password(current_password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    hashed_password = hash_password(new_password)
    
    # Update password
    await users_collection.update_one(
        {"_id": user_id},
        {"$set": {"password": hashed_password}}
    )
    
    print(f"✅ Password changed successfully for {user.get('email')}")
    
    return {
        "success": True,
        "message": "Password changed successfully"
    }

