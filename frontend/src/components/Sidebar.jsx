import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Sidebar({ currentPage }) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <h2 style={styles.title}>PGRKAM</h2>
        <p style={styles.subtitle}>Smart Chatbot</p>
      </div>

      <nav style={styles.nav}>
        <Link
          to="/chat"
          style={{
            ...styles.navLink,
            ...(currentPage === "chat" ? styles.activeLink : {}),
          }}
        >
          💬 Chat
        </Link>
        <Link
          to="/history"
          style={{
            ...styles.navLink,
            ...(currentPage === "history" ? styles.activeLink : {}),
          }}
        >
          📜 History
        </Link>
        <Link
          to="/profile"
          style={{
            ...styles.navLink,
            ...(currentPage === "profile" ? styles.activeLink : {}),
          }}
        >
          👤 Profile
        </Link>
      </nav>

      <div style={styles.footer}>
        <button onClick={handleLogout} style={styles.logoutButton}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "250px",
    height: "100vh",
    background: "#1a1a1a",
    color: "white",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #333",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "bold",
    color: "#0059ff",
  },
  subtitle: {
    margin: "5px 0 0 0",
    fontSize: "14px",
    color: "#888",
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navLink: {
    padding: "12px 16px",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#ccc",
    fontSize: "16px",
    transition: "all 0.2s",
    display: "block",
  },
  activeLink: {
    background: "#0059ff",
    color: "white",
    fontWeight: "500",
  },
  footer: {
    paddingTop: "20px",
    borderTop: "1px solid #333",
  },
  logoutButton: {
    width: "100%",
    padding: "12px",
    background: "#333",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
};
