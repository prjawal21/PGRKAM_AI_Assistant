import { useState, useEffect, useContext } from "react";
import { api } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import MessageBubble from "../components/MessageBubble";

export default function ChatHistory() {
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Convert history items to message format for MessageBubble
      const messages = res.data.flatMap((item) => [
        {
          role: "user",
          text: item.user_message,
          content: item.user_message,
          timestamp: item.timestamp,
        },
        {
          role: "assistant",
          text: item.assistant_response,
          content: item.assistant_response,
          timestamp: item.timestamp,
        },
      ]);

      setHistory(messages);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar currentPage="history" />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📜 Chat History</h1>
            <p style={styles.subtitle}>View your past conversations</p>
          </div>
          <button onClick={fetchHistory} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.loading}>Loading chat history...</div>
        ) : history.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <h3 style={styles.emptyTitle}>No chat history yet</h3>
            <p style={styles.emptyText}>
              Start a conversation in the Chat page to see your history here!
            </p>
          </div>
        ) : (
          <div style={styles.historyContainer}>
            {history.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: "40px",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
  },
  title: {
    fontSize: "32px",
    color: "#333",
    margin: "0 0 4px 0",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },
  refreshButton: {
    padding: "12px 24px",
    background: "#0059ff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  historyContainer: {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: "400px",
    background: "#fafafa",
  },
  loading: {
    textAlign: "center",
    padding: "60px",
    color: "#666",
    fontSize: "16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
  },
  error: {
    padding: "12px",
    background: "#fee",
    color: "#c33",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },
};
