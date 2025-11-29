export default function VoiceControls({
  voiceEnabled,
  onVoiceToggle,
  speechToTextEnabled,
  onSpeechToTextToggle,
  textToSpeechEnabled,
  onTextToSpeechToggle,
  isListening,
  isSpeaking,
}) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>🎤 Voice Features</h3>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => onVoiceToggle(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.slider}></span>
          <span style={styles.labelText}>
            {voiceEnabled ? "Enabled" : "Disabled"}
          </span>
        </label>
      </div>

      {voiceEnabled && (
        <div style={styles.controls}>
          <label style={styles.controlItem}>
            <input
              type="checkbox"
              checked={speechToTextEnabled}
              onChange={(e) => onSpeechToTextToggle(e.target.checked)}
              style={styles.checkbox}
              disabled={!voiceEnabled}
            />
            <span style={styles.controlLabel}>
              🎤 Speech-to-Text
              {isListening && <span style={styles.status}> (Listening...)</span>}
            </span>
          </label>

          <label style={styles.controlItem}>
            <input
              type="checkbox"
              checked={textToSpeechEnabled}
              onChange={(e) => onTextToSpeechToggle(e.target.checked)}
              style={styles.checkbox}
              disabled={!voiceEnabled}
            />
            <span style={styles.controlLabel}>
              🔊 Text-to-Speech
              {isSpeaking && <span style={styles.status}> (Speaking...)</span>}
            </span>
          </label>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    background: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    marginBottom: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#333",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    position: "relative",
  },
  checkbox: {
    width: "44px",
    height: "24px",
    appearance: "none",
    background: "#ccc",
    borderRadius: "12px",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.3s",
    margin: 0,
  },
  slider: {
    position: "absolute",
    top: "2px",
    left: "2px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "white",
    transition: "transform 0.3s",
    pointerEvents: "none",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  labelText: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "500",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e0e0e0",
  },
  controlItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },
  controlLabel: {
    fontSize: "14px",
    color: "#333",
    cursor: "pointer",
  },
  status: {
    fontSize: "12px",
    color: "#0059ff",
    fontStyle: "italic",
  },
};

// Add CSS for toggle switch
if (typeof document !== "undefined") {
  const styleId = "voice-controls-styles";
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.textContent = `
      input[type="checkbox"]:checked {
        background: #0059ff !important;
      }
      input[type="checkbox"]:checked + span {
        transform: translateX(20px) !important;
      }
      input[type="checkbox"]:disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

