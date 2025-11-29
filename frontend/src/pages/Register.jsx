import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "Personalized Guidance",
      description: "Get tailored career advice and job recommendations based on your skills and goals",
      icon: "🎯"
    },
    {
      title: "Skill Enhancement",
      description: "Access training programs and resources to boost your professional capabilities",
      icon: "📈"
    },
    {
      title: "Job Opportunities",
      description: "Discover employment and entrepreneurship opportunities in Punjab",
      icon: "💼"
    }
  ];

  // Rotate features every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/api/auth/register", form);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-gradient-bg">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>
      </div>

      {/* Header Logo */}
      <div className="login-header">
        <img src="/logo.png" alt="PGRKAM Logo" className="login-logo-img" />
        <h1 className="login-brand">PGRKAM AI Assistant</h1>
      </div>

      {/* Main Register Card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left Panel - Form */}
        <div className="login-form-panel">
          <div className="login-form-header">
            <h2 className="login-title">Create Account</h2>
            <p className="login-subtitle">
              Join PGRKAM to access personalized career guidance and opportunities
            </p>
          </div>

          {success && (
            <motion.div
              className="login-error"
              style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {success}
            </motion.div>
          )}

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password (min 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="form-input password-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="login-button"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </motion.button>

            <div className="login-footer-links" style={{ justifyContent: 'center' }}>
              <Link to="/login" className="footer-link">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </div>

        {/* Right Panel - Feature Showcase */}
        <div className="login-visual-panel">
          <div className="feature-showcase">
            <motion.div
              key={currentFeature}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="feature-icon">{features[currentFeature].icon}</div>
              <h3 className="feature-title">{features[currentFeature].title}</h3>
              <p className="feature-description">
                {features[currentFeature].description}
              </p>
            </motion.div>

            {/* Feature Dots */}
            <div className="feature-dots">
              {features.map((_, index) => (
                <button
                  key={index}
                  className={`feature-dot ${index === currentFeature ? "active" : ""}`}
                  onClick={() => setCurrentFeature(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
