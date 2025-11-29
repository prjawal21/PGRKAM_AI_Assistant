import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for speech-to-text using Web Speech API
 * @param {string} lang - Language code (e.g., 'en', 'hi', 'pa')
 * @param {boolean} enabled - Whether speech recognition is enabled
 * @returns {object} - Speech recognition state and controls
 */
export function useSpeechRecognition(lang = "en", enabled = true) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Convert language code to STT format
  const getSttLang = (langCode) => {
    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'pa': 'pa-IN'
    };
    return langMap[langCode] || 'en-US';
  };

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getSttLang(lang);

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang]);

  const startListening = () => {
    if (recognitionRef.current && enabled && !isListening) {
      setTranscript("");
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError("Failed to start speech recognition");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript("");
  };

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
    supported: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}

