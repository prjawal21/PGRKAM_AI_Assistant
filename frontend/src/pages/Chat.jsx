import { useState, useEffect, useContext, useRef } from "react";
import { api } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";
import LanguageSwitcher from "../components/LanguageSwitcher";
import VoiceControls from "../components/VoiceControls";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

export default function Chat() {
  const { token } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const [userProfile, setUserProfile] = useState({});

  // Language and Voice Settings
  const [language, setLanguage] = useState("en-US");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechToTextEnabled, setSpeechToTextEnabled] = useState(false);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false);

  // Speech Recognition Hook
  const {
    transcript,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
    supported: speechSupported,
  } = useSpeechRecognition(language, speechToTextEnabled && voiceEnabled);

  // Speech Synthesis Hook
  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    supported: synthesisSupported,
  } = useSpeechSynthesis(language, textToSpeechEnabled && voiceEnabled);

  // Fetch user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update input when transcript changes (speech-to-text)
  useEffect(() => {
    if (transcript && speechToTextEnabled && voiceEnabled) {
      setInput(transcript);
    }
  }, [transcript, speechToTextEnabled, voiceEnabled]);

  // Auto speak AI responses when text-to-speech is enabled
  useEffect(() => {
    if (
      messages.length > 0 &&
      textToSpeechEnabled &&
      voiceEnabled &&
      !loading
    ) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.text) {
        // Small delay to ensure message is fully rendered
        const timer = setTimeout(() => {
          speak(lastMessage.text || lastMessage.content, { lang: language });
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, textToSpeechEnabled, voiceEnabled, loading, language, speak]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(res.data.profile || {});
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const handleMicrophoneClick = () => {
    if (!speechSupported) {
      setError("Speech recognition not supported in your browser");
      return;
    }

    if (isListening) {
      stopListening();
      resetTranscript();
    } else {
      resetTranscript();
      setInput("");
      startListening();
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // Stop listening if active
    if (isListening) {
      stopListening();
    }

    // Stop any ongoing speech
    if (isSpeaking) {
      stopSpeaking();
    }

    const userMessage = input.trim();
    setInput("");
    setError("");
    resetTranscript();

    // Add user message to UI immediately
    const userMsg = { role: "user", text: userMessage, content: userMessage };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);

    try {
      // Build history from current messages
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content || msg.text,
      }));

      // Call API with message, history, and user_profile
      const res = await api.post(
        "/api/chat",
        {
          message: userMessage,
          history: history,
          user_profile: userProfile,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add AI response to messages
      const aiMsg = {
        role: "assistant",
        text: res.data.response,
        content: res.data.response,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Auto-speak will be triggered by useEffect above
    } catch (err) {
      setError(err.response?.data?.detail || "Error: Unable to get response.");
      const errorMsg = {
        role: "assistant",
        text: err.response?.data?.detail || "Error: Unable to get response.",
        content: err.response?.data?.detail || "Error: Unable to get response.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar currentPage="chat" />
      <div style={styles.chatArea}>
        {/* Chat Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>💬 Chat</h1>
            <p style={styles.subtitle}>Start a conversation with AI assistant</p>
          </div>
          <div style={styles.headerControls}>
            <LanguageSwitcher
              currentLang={language}
              onLanguageChange={setLanguage}
            />
          </div>
        </div>

        {/* Voice Controls */}
        <div style={styles.voiceControlsContainer}>
          <VoiceControls
            voiceEnabled={voiceEnabled}
            onVoiceToggle={setVoiceEnabled}
            speechToTextEnabled={speechToTextEnabled}
            onSpeechToTextToggle={setSpeechToTextEnabled}
            textToSpeechEnabled={textToSpeechEnabled}
            onTextToSpeechToggle={setTextToSpeechEnabled}
            isListening={isListening}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Messages Container */}
        <div style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💭</div>
              <h3 style={styles.emptyTitle}>Start a conversation</h3>
              <p style={styles.emptyText}>
                Type a message below to begin chatting with the AI assistant.
                {voiceEnabled && speechToTextEnabled && (
                  <span> Or use the microphone button to speak!</span>
                )}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble key={index} message={msg} />
            ))
          )}

          {loading && (
            <div style={styles.loadingBubble}>
              <span style={styles.typingText}>Assistant is typing</span>
              <div style={styles.typingDots}>
                <span style={{ ...styles.dot, animationDelay: "0s" }}></span>
                <span style={{ ...styles.dot, animationDelay: "0.2s" }}></span>
                <span style={{ ...styles.dot, animationDelay: "0.4s" }}></span>
              </div>
            </div>
          )}

          {(error || speechError) && (
            <div style={styles.errorBubble}>
              {error || speechError}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} style={styles.inputArea}>
          {voiceEnabled && speechToTextEnabled && (
            <button
              type="button"
              onClick={handleMicrophoneClick}
              style={{
                ...styles.micButton,
                ...(isListening ? styles.micButtonActive : {}),
              }}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? "🛑" : "🎤"}
            </button>
          )}
          <input
            style={styles.input}
            placeholder={
              voiceEnabled && speechToTextEnabled
                ? "Type or speak your message..."
                : "Type your message..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading || isListening}
            autoFocus
          />
          <button
            type="submit"
            style={{
              ...styles.sendButton,
              ...(loading || !input.trim() ? styles.sendButtonDisabled : {}),
            }}
            disabled={loading || !input.trim()}
          >
            <span style={styles.sendIcon}>📤</span>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#f5f5f5",
    overflow: "hidden",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "white",
    margin: "20px",
    marginLeft: "0",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  header: {
    padding: "24px 30px",
    borderBottom: "1px solid #eee",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "28px",
    margin: "0 0 4px 0",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "14px",
    margin: 0,
    opacity: 0.9,
  },
  headerControls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  voiceControlsContainer: {
    padding: "16px 30px 0",
    background: "white",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 30px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    background: "#fafafa",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#888",
  },
  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "24px",
    margin: "0 0 8px 0",
    color: "#666",
  },
  emptyText: {
    fontSize: "16px",
    margin: 0,
    color: "#999",
    textAlign: "center",
  },
  loadingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 18px",
    borderRadius: "18px",
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    alignSelf: "flex-start",
    maxWidth: "70%",
  },
  typingText: {
    fontSize: "14px",
    color: "#666",
    fontStyle: "italic",
  },
  typingDots: {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#999",
    animation: "typing 1.4s infinite ease-in-out",
  },
  errorBubble: {
    padding: "12px 16px",
    borderRadius: "8px",
    background: "#fee",
    color: "#c33",
    alignSelf: "flex-start",
    maxWidth: "70%",
    fontSize: "14px",
  },
  inputArea: {
    display: "flex",
    padding: "20px 30px",
    borderTop: "1px solid #eee",
    background: "white",
    gap: "12px",
    alignItems: "center",
  },
  micButton: {
    padding: "14px",
    fontSize: "20px",
    background: "#f0f0f0",
    border: "1px solid #ddd",
    borderRadius: "50%",
    cursor: "pointer",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  micButtonActive: {
    background: "#ff4444",
    borderColor: "#ff4444",
    animation: "pulse 1.5s infinite",
  },
  input: {
    flex: 1,
    padding: "14px 20px",
    fontSize: "16px",
    border: "2px solid #ddd",
    borderRadius: "24px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  sendButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 28px",
    fontSize: "16px",
    fontWeight: "600",
    background: "#0059ff",
    color: "white",
    border: "none",
    borderRadius: "24px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  sendButtonDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  sendIcon: {
    fontSize: "18px",
  },
};
