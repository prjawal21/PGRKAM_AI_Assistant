import { useState, useEffect, useRef } from "react";

/**
 * Custom hook for text-to-speech using SpeechSynthesis API
 * @param {string} lang - Language code (e.g., 'en-US', 'hi-IN', 'pa-IN')
 * @param {boolean} enabled - Whether speech synthesis is enabled
 * @returns {object} - Speech synthesis state and controls
 */
export function useSpeechSynthesis(lang = "en-US", enabled = true) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setError("Speech synthesis not supported in this browser");
      return;
    }

    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text, options = {}) => {
    if (!enabled || !window.speechSynthesis) {
      setError("Speech synthesis not available");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || lang;
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return {
    isSpeaking,
    isPaused,
    error,
    speak,
    pause,
    resume,
    stop,
    supported: !!window.speechSynthesis,
  };
}

