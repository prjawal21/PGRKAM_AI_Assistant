"""
FastAPI application entry point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes AFTER loading dotenv
from routes import api_router

# Initialize FastAPI app
app = FastAPI(
    title="PGRKAM LLM Backend",
    version="1.0.0",
    description="FastAPI backend for PGRKAM chatbot application"
)

# CORS middleware configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PGRKAM LLM Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""

    # Import inside function to avoid circular import issues
    from utils.ollama import OLLAMA_HOST, OLLAMA_MODEL

    return {
        "status": "healthy",
        "ollama_host": OLLAMA_HOST,
        "ollama_model": OLLAMA_MODEL
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )
