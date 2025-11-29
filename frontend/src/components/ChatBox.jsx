import { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatBox({ messages, loading, onSendMessage }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    onSendMessage(input);
    setInput("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Start a conversation by sending a message!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))
        )}

        {loading && (
          <div style={styles.loadingBubble}>
            <span>Assistant is typing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <input
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          style={styles.sendButton}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#f5f5f5",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    color: "#888",
    fontSize: "16px",
  },
  loadingBubble: {
    padding: "12px 16px",
    borderRadius: "18px",
    background: "#e0e0e0",
    alignSelf: "flex-start",
    maxWidth: "70%",
    fontSize: "14px",
    color: "#666",
    fontStyle: "italic",
  },
  inputForm: {
    display: "flex",
    padding: "16px",
    borderTop: "1px solid #ddd",
    background: "#fff",
    gap: "8px",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "24px",
    outline: "none",
  },
  sendButton: {
    padding: "12px 24px",
    fontSize: "16px",
    background: "#0059ff",
    color: "white",
    border: "none",
    borderRadius: "24px",
    cursor: "pointer",
    fontWeight: "500",
  },
};

