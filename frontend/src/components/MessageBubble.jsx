export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const content = message.content || message.text || "";

  return (
    <div
      style={{
        ...styles.container,
        ...(isUser ? styles.userContainer : styles.assistantContainer),
      }}
    >
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.assistantBubble),
        }}
      >
        <div style={styles.content}>{content}</div>
        {message.timestamp && (
          <div style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    width: "100%",
    marginBottom: "4px",
  },
  userContainer: {
    justifyContent: "flex-end",
  },
  assistantContainer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "70%",
    padding: "14px 18px",
    borderRadius: "18px",
    wordWrap: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  userBubble: {
    background: "linear-gradient(135deg, #0059ff 0%, #0040cc 100%)",
    color: "white",
    borderBottomRightRadius: "4px",
  },
  assistantBubble: {
    background: "#ffffff",
    color: "#333",
    border: "1px solid #e0e0e0",
    borderBottomLeftRadius: "4px",
  },
  content: {
    fontSize: "15px",
    lineHeight: "1.6",
    whiteSpace: "pre-wrap",
  },
  timestamp: {
    fontSize: "11px",
    opacity: 0.7,
    marginTop: "6px",
  },
};

