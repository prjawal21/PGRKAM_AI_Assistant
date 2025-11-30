from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from elevenlabs import ElevenLabs
import os
from io import BytesIO

router = APIRouter()

client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

class TTSRequest(BaseModel):
    text: str

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    try:
        if not request.text:
            raise HTTPException(status_code=400, detail="No text provided")

        audio_generator = client.text_to_speech.convert(
            voice_id="21m00Tcm4TlvDq8ikWAM",
            text=request.text,
            model_id="eleven_multilingual_v2"
        )

        audio_bytes = BytesIO()
        for chunk in audio_generator:
            audio_bytes.write(chunk)
        
        audio_bytes.seek(0)
        
        return StreamingResponse(
            audio_bytes,
            media_type='audio/mpeg'
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
