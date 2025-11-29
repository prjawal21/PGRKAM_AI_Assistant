import { useState } from "react";

const LANGUAGES = [
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi", flag: "🇮🇳" },
];

export default function LanguageSwitcher({ currentLang, onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === currentLang) || LANGUAGES[0];

  const handleSelect = (lang) => {
    onLanguageChange(lang.code);
    setIsOpen(false);
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.button}
        title={`Current language: ${currentLanguage.name}`}
      >
        <span style={styles.flag}>{currentLanguage.flag}</span>
        <span style={styles.name}>{currentLanguage.name}</span>
        <span style={styles.arrow}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div style={styles.overlay} onClick={() => setIsOpen(false)} />
          <div style={styles.dropdown}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                style={{
                  ...styles.option,
                  ...(lang.code === currentLang ? styles.optionActive : {}),
                }}
              >
                <span style={styles.flag}>{lang.flag}</span>
                <span style={styles.optionName}>{lang.name}</span>
                {lang.code === currentLang && (
                  <span style={styles.check}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
  },
  button: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
    transition: "all 0.2s",
  },
  flag: {
    fontSize: "20px",
  },
  name: {
    fontSize: "14px",
  },
  arrow: {
    fontSize: "10px",
    color: "#666",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 999,
    minWidth: "180px",
    overflow: "hidden",
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "12px 16px",
    background: "white",
    border: "none",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s",
  },
  optionActive: {
    background: "#f0f4ff",
    color: "#0059ff",
    fontWeight: "500",
  },
  optionName: {
    flex: 1,
  },
  check: {
    color: "#0059ff",
    fontWeight: "bold",
  },
};

