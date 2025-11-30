import { useState, useCallback } from 'react';
import { api } from '../api/api';

export function useElevenLabsTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [audioElement, setAudioElement] = useState(null);

    const speak = useCallback(async (text) => {
        if (!text) return;

        try {
            setIsSpeaking(true);

            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }

            const response = await api.post('/api/tts', { text }, {
                responseType: 'blob'
            });

            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            setAudioElement(audio);

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (error) {
            console.error('ElevenLabs TTS error:', error);
            setIsSpeaking(false);
        }
    }, [audioElement]);

    const stop = useCallback(() => {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            setIsSpeaking(false);
        }
    }, [audioElement]);

    return {
        isSpeaking,
        speak,
        stop
    };
}
