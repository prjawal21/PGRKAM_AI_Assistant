import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition(language = 'en-US', enabled = true) {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState('');
    const [supported, setSupported] = useState(false);

    const recognitionRef = useRef(null);

    // Check if speech recognition is supported
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        setSupported(!!SpeechRecognition);

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = language;

            recognitionRef.current.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setTranscript((finalTranscript || interimTranscript).trim());
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setError(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language]);

    const startListening = useCallback(() => {
        if (!supported || !enabled) {
            setError('Speech recognition not supported or not enabled');
            return;
        }

        try {
            setError('');
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        } catch (err) {
            console.error('Error starting speech recognition:', err);
            setError('Failed to start speech recognition');
        }
    }, [supported, enabled]);

    const stopListening = useCallback(() => {
        try {
            recognitionRef.current?.stop();
            setIsListening(false);
        } catch (err) {
            console.error('Error stopping speech recognition:', err);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setError('');
    }, []);

    return {
        transcript,
        isListening,
        error,
        startListening,
        stopListening,
        resetTranscript,
        supported
    };
}
