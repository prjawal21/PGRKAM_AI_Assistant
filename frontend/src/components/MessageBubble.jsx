export default function MessageBubble({ message, onSpeak, isSpeaking = false }) {
    const isUser = message.role === "user";
    const content = message.content || message.text || "";

    const handleSpeakClick = () => {
        if (onSpeak && !isUser) {
            onSpeak(content);
        }
    };

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
                {/* Message content */}
                <div style={styles.content}>{content}</div>

                {/* Timestamp */}
                {message.timestamp && (
                    <div style={styles.timestamp}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                )}

                {/* 🔊 NEW — Fixed Position Speaker Icon */}
                {!isUser && onSpeak && (
                    <div
                        onClick={handleSpeakClick}
                        style={{
                            ...styles.speakerIcon,
                            ...(isSpeaking ? styles.speakerIconActive : {}),
                        }}
                        title={isSpeaking ? "Speaking..." : "Click to listen"}
                    >
                        {isSpeaking ? "🔊" : "🔉"}
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
        marginBottom: "12px",
    },
    userContainer: {
        justifyContent: "flex-end",
    },
    assistantContainer: {
        justifyContent: "flex-start",
    },
    bubble: {
        maxWidth: "70%",
        padding: "16px 18px",
        borderRadius: "18px",
        position: "relative",         // 👈 required for absolute speaker
        background: "#ffffff",
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
        marginTop: "8px",
        fontSize: "11px",
        opacity: 0.6,
    },

    // 🔊 FIXED — SPEAKER ICON BOTTOM-RIGHT
    speakerIcon: {
        position: "absolute",
        bottom: "10px",
        right: "10px",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "rgba(0, 89, 255, 0.2)",
        border: "1px solid rgba(0, 89, 255, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "18px",
        transition: "all 0.2s ease",
        userSelect: "none",
    },
    speakerIconActive: {
        background: "rgba(0, 200, 100, 0.25)",
        borderColor: "rgba(0, 200, 100, 0.5)",
        animation: "pulse 1.5s infinite",
    },
};
