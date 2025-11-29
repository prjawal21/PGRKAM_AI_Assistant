"""
Authentication dependencies for FastAPI routes
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from bson import ObjectId
from db import users_collection
from utils.jwt import decode_access_token

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to get the current authenticated user from JWT token
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        User document from database
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Find user in database by _id
    try:
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        # Invalid ObjectId format
        raise credentials_exception
    
    if user is None:
        raise credentials_exception
    
    # Convert ObjectId to string for JSON serialization
    user["_id"] = str(user["_id"])
    
    return user
