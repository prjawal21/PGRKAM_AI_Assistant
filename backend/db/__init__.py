"""
Database connection module
"""
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pgrkam")

# Print database configuration for debugging
print("\n" + "="*60)
print("DATABASE CONFIGURATION")
print("="*60)
print(f"MONGODB_URI: {MONGO_URI}")
print(f"DATABASE_NAME: {DATABASE_NAME}")
print("="*60 + "\n")

# Initialize database connection
client = AsyncIOMotorClient(MONGO_URI)
db = client[DATABASE_NAME]

# Collections
users_collection = db["users"]
chat_collection = db["chat_history"]  # Legacy collection
chats_collection = db["chats"]  # New chats collection grouped by user

