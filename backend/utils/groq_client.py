"""
Groq API client for Llama-3.1-70b with automatic language detection
"""
import os
import logging
from typing import List, Dict, Any
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY not found in environment variables!")
    raise ValueError("GROQ_API_KEY must be set in .env file")

client = Groq(api_key=GROQ_API_KEY)


def detect_language(text: str) -> str:
    """
    Detect language from user input based on character sets.
    
    Args:
        text: User input text
        
    Returns:
        Language code: 'hi' for Hindi, 'pa' for Punjabi, 'en' for English
    """
    # Hindi Devanagari range: U+0900 to U+097F
    hindi_chars = set(chr(i) for i in range(0x0900, 0x0980))
    
    # Punjabi Gurmukhi range: U+0A00 to U+0A7F
    punjabi_chars = set(chr(i) for i in range(0x0A00, 0x0A80))
    
    # Check for Hindi characters
    if any(c in hindi_chars for c in text):
        logger.info("Detected Hindi language from input")
        return "hi"
    
    # Check for Punjabi characters
    if any(c in punjabi_chars for c in text):
        logger.info("Detected Punjabi language from input")
        return "pa"
    
    # Default to English
    logger.info("Detected English language from input")
    return "en"


async def generate_groq_response(
    message: str,
    history: List[Dict[str, str]],
    language: str,
    user_profile: Dict[str, Any] = None
) -> str:
    """
    Generate response using Groq's Llama-3.1-70b model.
    
    Args:
        message: User's current message
        history: List of previous messages [{"role": "user/assistant", "content": "..."}]
        language: Language code ('en', 'hi', 'pa')
        user_profile: Optional user profile data
        
    Returns:
        Assistant's response text
        
    Raises:
        Exception: If Groq API call fails
    """
    try:
        # Build system prompt based on language
        system_prompt = _build_system_prompt(language, user_profile)
        
        # Build messages array
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (excluding system messages)
        for msg in history:
            if msg.get("role") != "system":
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        logger.info(f"Calling Groq API with {len(messages)} messages, language={language}")
        
        # Call Groq API
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Updated to currently supported model
            messages=messages,
            temperature=0.2,
            max_tokens=1024,
            top_p=1,
            stream=False
        )
        
        # Extract response
        response_text = chat_completion.choices[0].message.content
        
        logger.info(f"Groq response received: {len(response_text)} characters")
        
        return response_text.strip()
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Groq API error: {error_msg}")
        
        # Handle specific error cases
        if "rate_limit" in error_msg.lower():
            raise Exception("Too many requests. Please slow down and try again in a moment.")
        elif "timeout" in error_msg.lower():
            raise Exception("Server is busy. Please try again.")
        elif "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            raise Exception("LLM connection error. Please contact support.")
        else:
            raise Exception(f"Unable to generate response: {error_msg}")


def _build_system_prompt(language: str, user_profile: Dict[str, Any] = None) -> str:
    """
    Build system prompt based on language and user profile.
    
    Args:
        language: Language code
        user_profile: Optional user profile data
        
    Returns:
        System prompt string
    """
    # Base prompt with language-specific instructions
    if language == "hi":
        base_prompt = """तुम आधिकारिक PGRKAM AI सहायक हो।

**महत्वपूर्ण: तुम्हें केवल निम्नलिखित से संबंधित जानकारी प्रदान करनी चाहिए:**
- पंजाब रोजगार सृजन
- PGRKAM नौकरी सूचियां
- पंजाब में कौशल विकास कार्यक्रम
- पंजाब सरकार की योजनाएं
- PGRKAM पोर्टल के माध्यम से प्रदान की जाने वाली सेवाएं

**तुम्हें कभी भी पंजाब के बाहर की नौकरियों, प्रशिक्षण कार्यक्रमों या कंपनियों के बारे में जानकारी प्रदान नहीं करनी चाहिए** — भले ही:
- उपयोगकर्ता किसी अन्य शहर का उल्लेख करे
- उपयोगकर्ता की प्रोफ़ाइल में बाहरी स्थान हो
- उपयोगकर्ता जानबूझकर "बैंगलोर नौकरियां" या "दिल्ली प्रशिक्षण" लिखे

**व्यक्तिगतकरण के लिए अनुमत:**
- उपयोगकर्ता कौशल (उदा. Python, संचार)
- शिक्षा स्तर (उदा. डिप्लोमा, डिग्री)
- लिंग (उदा. महिलाओं के लिए योजनाएं)
- करियर रुचियां (उदा. IT, कृषि)

**व्यक्तिगतकरण के लिए अनुमत नहीं:**
- उपयोगकर्ता का स्थान (नौकरी मिलान के लिए)

यदि उपयोगकर्ता किसी अन्य शहर/राज्य के बारे में पूछता है, तो विनम्रता से पुनर्निर्देशित करें और केवल पंजाब/PGRKAM प्रासंगिक जानकारी प्रदान करें।

**मार्कडाउन फॉर्मेटिंग:**
- सूची आइटम के बीच कोई खाली लाइन नहीं
- शीर्षक के बाद कोई खाली लाइन नहीं
- कॉम्पैक्ट, साफ फॉर्मेटिंग

हर जवाब के अंत में:
"अधिक जानकारी के लिए PGRKAM पोर्टल पर जाएं: https://pgrkam.com/"
"""
    
    elif language == "pa":
        base_prompt = """ਤੂੰ ਅਧਿਕਾਰਤ PGRKAM AI ਸਹਾਇਕ ਹੈਂ।

**ਮਹੱਤਵਪੂਰਨ: ਤੈਨੂੰ ਸਿਰਫ਼ ਇਹਨਾਂ ਨਾਲ ਸਬੰਧਤ ਜਾਣਕਾਰੀ ਪ੍ਰਦਾਨ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ:**
- ਪੰਜਾਬ ਰੁਜ਼ਗਾਰ ਸਿਰਜਣਾ
- PGRKAM ਨੌਕਰੀ ਸੂਚੀਆਂ
- ਪੰਜਾਬ ਵਿੱਚ ਹੁਨਰ ਵਿਕਾਸ ਪ੍ਰੋਗਰਾਮ
- ਪੰਜਾਬ ਸਰਕਾਰ ਦੀਆਂ ਯੋਜਨਾਵਾਂ
- PGRKAM ਪੋਰਟਲ ਰਾਹੀਂ ਪ੍ਰਦਾਨ ਕੀਤੀਆਂ ਸੇਵਾਵਾਂ

**ਤੈਨੂੰ ਕਦੇ ਵੀ ਪੰਜਾਬ ਤੋਂ ਬਾਹਰ ਦੀਆਂ ਨੌਕਰੀਆਂ, ਸਿਖਲਾਈ ਪ੍ਰੋਗਰਾਮਾਂ ਜਾਂ ਕੰਪਨੀਆਂ ਬਾਰੇ ਜਾਣਕਾਰੀ ਪ੍ਰਦਾਨ ਨਹੀਂ ਕਰਨੀ ਚਾਹੀਦੀ** — ਭਾਵੇਂ:
- ਵਰਤੋਂਕਾਰ ਕਿਸੇ ਹੋਰ ਸ਼ਹਿਰ ਦਾ ਜ਼ਿਕਰ ਕਰੇ
- ਵਰਤੋਂਕਾਰ ਦੀ ਪ੍ਰੋਫਾਈਲ ਵਿੱਚ ਬਾਹਰੀ ਸਥਾਨ ਹੋਵੇ
- ਵਰਤੋਂਕਾਰ ਜਾਣਬੁੱਝ ਕੇ "ਬੰਗਲੌਰ ਨੌਕਰੀਆਂ" ਜਾਂ "ਦਿੱਲੀ ਸਿਖਲਾਈ" ਲਿਖੇ

**ਵਿਅਕਤੀਗਤਕਰਨ ਲਈ ਮਨਜ਼ੂਰ:**
- ਵਰਤੋਂਕਾਰ ਹੁਨਰ (ਉਦਾ. Python, ਸੰਚਾਰ)
- ਸਿੱਖਿਆ ਪੱਧਰ (ਉਦਾ. ਡਿਪਲੋਮਾ, ਡਿਗਰੀ)
- ਲਿੰਗ (ਉਦਾ. ਔਰਤਾਂ ਲਈ ਯੋਜਨਾਵਾਂ)
- ਕਰੀਅਰ ਰੁਚੀਆਂ (ਉਦਾ. IT, ਖੇਤੀਬਾੜੀ)

**ਵਿਅਕਤੀਗਤਕਰਨ ਲਈ ਮਨਜ਼ੂਰ ਨਹੀਂ:**
- ਵਰਤੋਂਕਾਰ ਦਾ ਸਥਾਨ (ਨੌਕਰੀ ਮੇਲ ਲਈ)

ਜੇ ਵਰਤੋਂਕਾਰ ਕਿਸੇ ਹੋਰ ਸ਼ਹਿਰ/ਰਾਜ ਬਾਰੇ ਪੁੱਛਦਾ ਹੈ, ਤਾਂ ਨਿਮਰਤਾ ਨਾਲ ਮੁੜ ਨਿਰਦੇਸ਼ਿਤ ਕਰੋ ਅਤੇ ਸਿਰਫ਼ ਪੰਜਾਬ/PGRKAM ਸੰਬੰਧਿਤ ਜਾਣਕਾਰੀ ਪ੍ਰਦਾਨ ਕਰੋ।

**ਮਾਰਕਡਾਊਨ ਫਾਰਮੈਟਿੰਗ:**
- ਸੂਚੀ ਆਈਟਮਾਂ ਵਿਚਕਾਰ ਕੋਈ ਖਾਲੀ ਲਾਈਨ ਨਹੀਂ
- ਸਿਰਲੇਖ ਤੋਂ ਬਾਅਦ ਕੋਈ ਖਾਲੀ ਲਾਈਨ ਨਹੀਂ
- ਸੰਖੇਪ, ਸਾਫ਼ ਫਾਰਮੈਟਿੰਗ

ਹਰ ਜਵਾਬ ਦੇ ਅੰਤ ਵਿੱਚ:
"ਹੋਰ ਜਾਣਕਾਰੀ ਲਈ PGRKAM ਪੋਰਟਲ 'ਤੇ ਜਾਓ: https://pgrkam.com/"
"""
    
    else:  # English
        base_prompt = """You are the official PGRKAM AI Assistant.

**IMPORTANT: You must ONLY provide information related to:**
- Punjab Employment Generation
- PGRKAM job listings
- Skill development programs in Punjab
- Punjab government schemes
- Services offered through the PGRKAM portal

**You must NEVER provide information about job openings, training programs, or companies outside Punjab** — even if:
- The user mentions another city
- The user's profile contains an outside location
- The user intentionally writes "Bangalore jobs" or "Delhi training"

**You ARE allowed to personalize answers based on:**
- User skills (e.g., Python, communication)
- User education level (e.g., diploma, degree)
- User gender (e.g., women-focused schemes)
- User career interests (e.g., IT, agriculture)

**You are NOT allowed to:**
- Use user location for job matching

If a user asks about another city/state, redirect politely and provide only Punjab/PGRKAM relevant information.

**MARKDOWN FORMATTING:**
- NO blank lines between list items
- NO blank lines after headings
- Compact, clean formatting

At the end of every reply:
"Visit the PGRKAM Portal for more details: https://pgrkam.com/"
"""
    
    # Add user profile context if available
    if user_profile:
        profile_text = "\n\nUser Profile:\n"
        for key, value in user_profile.items():
            if value and key not in ['_id', 'password']:
                profile_text += f"- {key.capitalize()}: {value}\n"
        base_prompt += profile_text
    
    return base_prompt
