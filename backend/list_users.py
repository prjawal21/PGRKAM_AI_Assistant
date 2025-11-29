"""
List all users in database
"""
import asyncio
from db import users_collection

async def list_users():
    print("\n=== USERS IN DATABASE ===")
    count = 0
    async for user in users_collection.find({}):
        count += 1
        print(f"\nUser {count}:")
        print(f"  _id: {user['_id']}")
        print(f"  email: {user.get('email', 'N/A')}")
        print(f"  name: {user.get('name', 'N/A')}")
        print(f"  has chat_sessions: {'chat_sessions' in user}")
        if 'chat_sessions' in user:
            print(f"  sessions count: {len(user['chat_sessions'])}")
    
    print(f"\nTotal users: {count}")

asyncio.run(list_users())
