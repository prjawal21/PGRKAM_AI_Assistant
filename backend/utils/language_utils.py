"""
Language utilities for input normalization and text processing
"""
from typing import Optional
import logging

logger = logging.getLogger(__name__)


async def normalize_input(text: str, language: str, ollama_client=None) -> str:
    """
    Normalize user input to ensure proper script usage.
    Converts Hinglish → Hindi (Devanagari) and Roman Punjabi → Gurmukhi.
    
    Args:
        text: User input text
        language: Target language code (en, hi, pa)
        ollama_client: Ollama client for normalization (optional)
        
    Returns:
        Normalized text in proper script
    """
    if language == "en":
        return text
    
    # Check if text is already in native script
    if language == "hi":
        # Check if text contains Devanagari characters
        has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
        if has_devanagari and not _has_significant_english(text):
            logger.info("Text already in Devanagari, skipping normalization")
            return text
    
    elif language == "pa":
        # Check if text contains Gurmukhi characters
        has_gurmukhi = any('\u0A00' <= char <= '\u0A7F' for char in text)
        if has_gurmukhi and not _has_significant_english(text):
            logger.info("Text already in Gurmukhi, skipping normalization")
            return text
    
    # If ollama_client is not provided, return as-is
    # (normalization will happen in the main LLM call)
    if not ollama_client:
        logger.warning("No ollama_client provided for normalization, returning original text")
        return text
    
    # Create normalization prompt
    if language == "hi":
        convert_prompt = f"""Convert this Hinglish or English sentence to pure Hindi (Devanagari script only).
Do not add any explanation, just return the converted text.

Input: {text}
Output:"""
    
    elif language == "pa":
        convert_prompt = f"""Convert this Roman Punjabi or English sentence into proper Punjabi (Gurmukhi script only).
Do not add any explanation, just return the converted text.

Input: {text}
Output:"""
    
    else:
        return text
    
    try:
        # Call LLM for normalization
        logger.info(f"Normalizing input for language: {language}")
        response = await ollama_client.chat(
            model="tinyllama",
            messages=[{"role": "user", "content": convert_prompt}]
        )
        
        normalized = response.get("message", {}).get("content", "").strip()
        logger.info(f"Normalized: {text[:50]}... → {normalized[:50]}...")
        return normalized if normalized else text
        
    except Exception as e:
        logger.error(f"Error normalizing input: {e}")
        return text


def _has_significant_english(text: str) -> bool:
    """
    Check if text has significant English content (excluding job titles, links).
    
    Args:
        text: Text to check
        
    Returns:
        True if text has significant English content
    """
    # Count English alphabetic characters
    english_chars = sum(1 for char in text if 'a' <= char.lower() <= 'z')
    total_chars = len(text.replace(' ', ''))
    
    if total_chars == 0:
        return False
    
    # If more than 30% English characters, consider it significant
    return (english_chars / total_chars) > 0.3


def post_process_response(text: str, language: str) -> str:
    """
    Post-process LLM response to ensure language purity.
    
    Args:
        text: LLM response text
        language: Target language code
        
    Returns:
        Post-processed text
    """
    if language == "en":
        return text
    
    # For now, just return as-is
    # Future: Add logic to detect and remove unwanted English words
    # (except job titles, websites, technical terms)
    
    return text


async def rewrite_to_native_script(text: str, language: str, ollama_client=None) -> str:
    """
    Rewrite response to ensure pure native script (Hindi/Punjabi).
    Uses LLM to translate any mixed English content.
    
    Args:
        text: Original response text
        language: Target language (hi or pa)
        ollama_client: Ollama client for rewriting
        
    Returns:
        Rewritten text in pure native script
    """
    if language == "en" or not ollama_client:
        return text
    
    # Check if text has significant English content
    if not _has_significant_english(text):
        logger.info("Text already in native script, skipping rewrite")
        return text
    
    # Create rewriting prompt
    if language == "hi":
        rewrite_prompt = f"""Rewrite the following text into PURE Hindi (देवनागरी only).
Remove all English words unless they are:
- Technical terms (Python, JavaScript, etc.)
- Website links
- Job titles that sound awkward in Hindi

Keep the formatting clean with bullet points and proper spacing.

Original text:
{text}

Rewritten in pure Hindi:"""
    
    elif language == "pa":
        rewrite_prompt = f"""Rewrite the following text into PURE Punjabi (ਗੁਰਮੁਖੀ only).
Remove all English words unless they are:
- Technical terms (Python, JavaScript, etc.)
- Website links
- Job titles that sound awkward in Punjabi

Maintain proper bullet points and clean format.

Original text:
{text}

Rewritten in pure Punjabi:"""
    
    else:
        return text
    
    try:
        logger.info(f"Rewriting response to pure {language}")
        response = await ollama_client.chat(
            model="tinyllama",
            messages=[{"role": "user", "content": rewrite_prompt}]
        )
        
        rewritten = response.get("message", {}).get("content", "").strip()
        if rewritten:
            logger.info(f"Successfully rewrote to native script")
            return rewritten
        else:
            logger.warning("Rewrite returned empty, using original")
            return text
            
    except Exception as e:
        logger.error(f"Error rewriting to native script: {e}")
        return text
