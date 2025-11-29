"""
Chat routes with session-based storage and robust error handling
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from datetime import datetime
from uuid import uuid4
import logging
from bson import ObjectId  # CRITICAL: For MongoDB _id conversion
from auth.dependencies import get_current_user
from models.chat import ChatRequest, ChatResponse, ChatMessage, SessionListItem, ChatHistoryItem
from db import users_collection, chats_collection
from utils.groq_client import generate_groq_response, detect_language
from utils.language_prompts import get_system_prompt
from utils.language_utils import normalize_input, post_process_response, rewrite_to_native_script

router = APIRouter(prefix="/chat")  # CRITICAL FIX: Add /chat prefix
logger = logging.getLogger(__name__)


def generate_title(message: str) -> str:
    """Generate a title from the first message (truncate to 30-35 chars)"""
    clean_msg = message.strip()
    for prefix in ["Show me", "Help me", "Can you", "I want to", "I need", "Please"]:
        if clean_msg.lower().startswith(prefix.lower()):
            clean_msg = clean_msg[len(prefix):].strip()
    
    if clean_msg:
        clean_msg = clean_msg[0].upper() + clean_msg[1:]
    
    if len(clean_msg) > 35:
        clean_msg = clean_msg[:32] + "..."
    
    return clean_msg or "New Chat"


def format_markdown_response(text: str) -> str:
    """
    Format AI response to ensure proper Markdown rendering.
    Creates compact, professional formatting with tight spacing.
    """
    if not text or not text.strip():
        return text
    
    import re
    
    # First, normalize excessive newlines (max 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove trailing/leading whitespace from each line
    lines = [line.rstrip() for line in text.split('\n')]
    
    formatted_lines = []
    prev_was_empty = False
    prev_was_list = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Skip multiple consecutive empty lines
        if not stripped:
            if not prev_was_empty and formatted_lines:
                formatted_lines.append('')
                prev_was_empty = True
            prev_was_list = False
            continue
        
        prev_was_empty = False
        
        # Detect list items
        is_list_item = (stripped.startswith(('- ', '* ', '+ ', '• ')) or 
                       (len(stripped) > 2 and stripped[0].isdigit() and stripped[1] in '.)'))
        
        if is_list_item:
            # Only add blank line before first list item if previous wasn't a list
            if not prev_was_list and formatted_lines and formatted_lines[-1]:
                formatted_lines.append('')
            formatted_lines.append(line)
            prev_was_list = True
        # Detect headers
        elif stripped.startswith('#'):
            # Add blank line before header if needed
            if formatted_lines and formatted_lines[-1]:
                formatted_lines.append('')
            formatted_lines.append(line)
            prev_was_list = False
        # Detect bold sections (job titles, section headers)
        elif stripped.startswith('**') and stripped.endswith('**'):
            # Compact spacing for bold headers
            if formatted_lines and formatted_lines[-1]:
                formatted_lines.append('')
            formatted_lines.append(line)
            prev_was_list = False
        else:
            # Regular paragraph
            # Add spacing after list ends
            if prev_was_list and formatted_lines and formatted_lines[-1]:
                formatted_lines.append('')
                prev_was_list = False
            formatted_lines.append(line)
    
    result = '\n'.join(formatted_lines)
    
    # Clean up: ensure max 1 blank line between content
    result = re.sub(r'\n\n+', '\n\n', result)
    
    # Remove blank lines at start/end
    result = result.strip()
    
    return result


@router.post("", response_model=ChatResponse)  # Empty string so it becomes /api/chat
async def chat(
    request: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    stream: bool = Query(default=False),
):
    """
    Main chat endpoint - maintains backward compatibility
    Now automatically manages sessions in the background
    """
    user_id = current_user["_id"]
    
    logger.info(f"Chat request from user {user_id}: message_length={len(request.message)}")
    
    # Merge DB profile + incoming profile
    db_profile = current_user.get("profile", {})
    user_profile = {**db_profile, **request.user_profile}
    
    # Build formatted history (NO system messages)
    formatted_history = []
    for msg in request.history:
        if isinstance(msg, dict):
            role = msg.get("role", "user")
            if role != "system":
                formatted_history.append({
                    "role": role,
                    "content": msg.get("content", "")
                })
        else:
            if msg.role != "system":
                formatted_history.append({
                    "role": msg.role,
                    "content": msg.content
                })
    
    logger.info(f"Formatted history: {len(formatted_history)} messages")
    
    # ===== CRITICAL: Ensure chat_sessions array exists =====
    print(f"\n=== CHAT SESSION INIT DEBUG ===")
    print(f"User ID from JWT (string): {user_id}")
    print(f"User ID type: {type(user_id)}")
    
    # CRITICAL FIX: Convert string user_id to ObjectId for MongoDB query
    try:
        user_object_id = ObjectId(user_id)
        print(f"Converted to ObjectId: {user_object_id}")
    except Exception as e:
        print(f"ERROR: Failed to convert user_id to ObjectId: {e}")
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = await users_collection.find_one({"_id": user_object_id})
    if not user:
        print(f"ERROR: User {user_object_id} not found in database!")
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"User document found!")
    print(f"User document keys: {list(user.keys())}")
    print(f"User _id in DB (type): {type(user['_id'])} = {user['_id']}")
    print(f"Has chat_sessions field: {'chat_sessions' in user}")
    
    # Initialize chat_sessions array if it doesn't exist or is not a list
    if "chat_sessions" not in user or not isinstance(user.get("chat_sessions"), list):
        print(f"🔧 INITIALIZING chat_sessions array for user {user_object_id}")
        logger.info(f"Initializing chat_sessions array for user {user_id}")
        
        result = await users_collection.update_one(
            {"_id": user_object_id},
            {"$set": {"chat_sessions": []}}
        )
        
        print(f"Update result - matched: {result.matched_count}, modified: {result.modified_count}")
        user["chat_sessions"] = []
        print(f"✅ chat_sessions array initialized")
    else:
        print(f"✓ chat_sessions already exists with {len(user['chat_sessions'])} sessions")
    
    print(f"=== END INIT DEBUG ===\n")
    
    # Get or create session
    session_id = request.session_id
    print(f"\n=== SESSION CREATION DEBUG ===")
    print(f"Incoming session_id: {session_id}")
    
    if not session_id:
        # Create new session
        session_id = str(uuid4())
        now = datetime.utcnow()
        new_session = {
            "session_id": session_id,
            "title": generate_title(request.message),
            "created_at": now,
            "updated_at": now,
            "messages": []
        }
        
        print(f"🆕 Creating NEW session: {session_id}")
        print(f"Session title: {new_session['title']}")
        logger.info(f"Creating new session: {session_id}")
        
        push_result = await users_collection.update_one(
            {"_id": user_object_id},  # Use ObjectId
            {"$push": {"chat_sessions": new_session}}
        )
        
        print(f"Push result - matched: {push_result.matched_count}, modified: {push_result.modified_count}")
        print(f"✅ New session created and pushed to array")
    else:
        print(f"📂 Using EXISTING session: {session_id}")
        logger.info(f"Using existing session: {session_id}")
        # Get existing session for history
        session = next(
            (s for s in user.get("chat_sessions", []) if s["session_id"] == session_id),
            None
        )
        
        if not session:
            print(f"⚠️ Session {session_id} not found in user's sessions, creating new one")
            logger.warning(f"Session {session_id} not found, creating new one")
            # Session doesn't exist, create it
            now = datetime.utcnow()
            new_session = {
                "session_id": session_id,
                "title": generate_title(request.message),
                "created_at": now,
                "updated_at": now,
                "messages": []
            }
            await users_collection.update_one(
                {"_id": user_object_id},  # Use ObjectId
                {"$push": {"chat_sessions": new_session}}
            )
            print(f"✅ Session {session_id} created")
        elif session:
            print(f"✓ Found session with {len(session.get('messages', []))} existing messages")
            # Use session messages as history if no history provided
            if not formatted_history:
                formatted_history = [
                    {"role": msg["role"], "content": msg["content"]}
                    for msg in session.get("messages", [])
                ]
    
    print(f"=== END SESSION DEBUG ===\n")
    
    # Detect language from user input (automatic detection)
    detected_language = detect_language(request.message)
    logger.info(f"Detected language: {detected_language}")
    
    # Use detected language, fallback to request language if provided
    language = detected_language or request.language or "en"
    logger.info(f"Using language: {language}")
    
    # Call Groq API with language-specific prompt
    logger.info("Calling Groq API...")
    try:
        ai_text = await generate_groq_response(
            message=request.message,
            history=formatted_history,
            language=language,
            user_profile=user_profile
        )
        logger.info(f"Groq response received: length={len(ai_text)}")
        
        # Format response for Markdown rendering
        ai_text = format_markdown_response(ai_text)
        logger.info(f"Markdown formatted response: length={len(ai_text)}")
        
    except Exception as e:
        logger.error(f"Groq API error: {str(e)}")
        raise HTTPException(status_code=502, detail=str(e))
    
    # Save messages to session
    now = datetime.utcnow()
    user_msg = {
        "role": "user",
        "content": request.message,
        "timestamp": now
    }
    assistant_msg = {
        "role": "assistant",
        "content": ai_text,
        "timestamp": now
    }
    
    logger.info("Updating session in database...")
    print(f"\n=== MESSAGE SAVE DEBUG ===")
    print(f"Saving to session: {session_id}")
    print(f"User message: {request.message[:50]}...")
    print(f"AI response: {ai_text[:50]}...")
    
    # Update session in database using array filters
    update_result = await users_collection.update_one(
        {"_id": user_object_id},  # Use ObjectId
        {
            "$push": {
                "chat_sessions.$[s].messages": {
                    "$each": [user_msg, assistant_msg]
                }
            },
            "$set": {
                "chat_sessions.$[s].updated_at": now
            }
        },
        array_filters=[{"s.session_id": session_id}]
    )
    
    print(f"Update result - matched: {update_result.matched_count}, modified: {update_result.modified_count}")
    
    if update_result.modified_count == 0:
        print(f"❌ ERROR: Failed to update session {session_id} for user {user_id}")
        logger.error(f"Failed to update session {session_id} for user {user_id}")
    else:
        print(f"✅ Session updated successfully: 2 messages added")
        logger.info(f"Session updated: session_id={session_id}, messages added: 2")
    
    print(f"=== END MESSAGE SAVE DEBUG ===\n")
    
    return ChatResponse(response=ai_text, session_id=session_id)


@router.post("/new-session", response_model=Dict[str, Any])
async def create_new_session(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new empty chat session"""
    user_id = current_user["_id"]
    
    # Ensure chat_sessions array exists
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if "chat_sessions" not in user or user["chat_sessions"] is None:
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"chat_sessions": []}}
        )
    
    session_id = str(uuid4())
    now = datetime.utcnow()
    
    new_session = {
        "session_id": session_id,
        "title": "New Chat",
        "created_at": now,
        "updated_at": now,
        "messages": []
    }
    
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"chat_sessions": new_session}}
    )
    
    logger.info(f"New session created: {session_id}")
    
    return {
        "success": True,
        "session_id": session_id,
        "chat_id": session_id  # Alias for compatibility
    }


@router.post("/new", response_model=Dict[str, Any])
async def create_new_chat(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new empty chat session (alias for /new-session)"""
    return await create_new_session(current_user)


@router.get("/sessions")
async def get_sessions(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get list of all chat sessions for the current user"""
    user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    
    if not user or "chat_sessions" not in user or not user["chat_sessions"]:
        return {"success": True, "sessions": []}
    
    sessions = []
    for session in user.get("chat_sessions", []):
        preview = None
        messages = session.get("messages", [])
        if messages:
            # Get preview from last user message
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    content = msg.get("content", "")
                    preview = content[:80] + "..." if len(content) > 80 else content
                    break
        
        sessions.append({
            "session_id": session["session_id"],
            "title": session["title"],
            "created_at": session.get("created_at", session.get("updated_at")),
            "updated_at": session["updated_at"],
            "preview": preview,
            "message_count": len(messages)
        })
    
    # Sort by updated_at descending (most recent first)
    sessions.sort(key=lambda x: x["updated_at"], reverse=True)
    
    logger.info(f"Returning {len(sessions)} sessions for user {current_user['_id']}")
    return {"success": True, "sessions": sessions}


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get full message history for a specific session"""
    user = await users_collection.find_one({"_id": ObjectId(current_user["_id"])})
    
    if not user or "chat_sessions" not in user:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = next(
        (s for s in user.get("chat_sessions", []) if s["session_id"] == session_id),
        None
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session["session_id"],
        "title": session["title"],
        "created_at": session.get("created_at", session.get("updated_at")),
        "updated_at": session["updated_at"],
        "messages": session.get("messages", [])
    }


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a chat session"""
    result = await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$pull": {"chat_sessions": {"session_id": session_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    logger.info(f"Session deleted: {session_id}")
    
    return {"success": True, "message": "Session deleted"}


@router.get("/history")
async def get_chat_history(
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Get chat history - returns from legacy chats collection
    This is for backward compatibility
    """
    cursor = chats_collection.find(
        {"user_id": current_user["_id"]}
    ).sort("timestamp", -1).limit(limit)
    
    history = []
    
    async for entry in cursor:
        history.append({
            "id": str(entry["_id"]),
            "user_id": entry["user_id"],
            "user_message": entry.get("message", ""),
            "assistant_response": entry.get("response", ""),
            "timestamp": entry["timestamp"],
        })
    
    history.reverse()
    return history
