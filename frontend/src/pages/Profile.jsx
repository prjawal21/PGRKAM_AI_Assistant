import { useState, useEffect, useContext } from "react";
import { api } from "../api/api";
import { AuthContext } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

export default function Profile() {
  const { token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    district: "",
    skills: "",
    category: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setFormData({
        district: res.data.profile?.district || "",
        skills: (res.data.profile?.skills || []).join(", "),
        category: res.data.profile?.category || "",
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const profileUpdate = {
        district: formData.district || null,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        category: formData.category || null,
      };

      await api.put("/api/profile", profileUpdate, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Profile updated successfully!");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar currentPage="profile" />
        <div style={styles.content}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar currentPage="profile" />
      <div style={styles.content}>
        <h1 style={styles.title}>Profile</h1>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {!editMode ? (
          <div style={styles.profileCard}>
            <div style={styles.profileHeader}>
              <h2>{profile?.name}</h2>
              <p style={styles.email}>{profile?.email}</p>
            </div>

            <div style={styles.profileSection}>
              <h3>Profile Information</h3>
              <div style={styles.infoRow}>
                <strong>District:</strong>{" "}
                {profile?.profile?.district || "Not set"}
              </div>
              <div style={styles.infoRow}>
                <strong>Skills:</strong>{" "}
                {profile?.profile?.skills?.length
                  ? profile.profile.skills.join(", ")
                  : "Not set"}
              </div>
              <div style={styles.infoRow}>
                <strong>Category:</strong>{" "}
                {profile?.profile?.category || "Not set"}
              </div>
              <div style={styles.infoRow}>
                <strong>Member since:</strong>{" "}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>

            <button
              onClick={() => setEditMode(true)}
              style={styles.editButton}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.profileCard}>
            <h3>Edit Profile</h3>

            <div style={styles.formGroup}>
              <label>District</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="Enter district"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Skills (comma-separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., Python, JavaScript, Design"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Enter category"
                style={styles.input}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.saveButton}>
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  fetchProfile();
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
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
  title: {
    fontSize: "32px",
    marginBottom: "30px",
    color: "#333",
  },
  profileCard: {
    background: "white",
    borderRadius: "12px",
    padding: "30px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    maxWidth: "600px",
  },
  profileHeader: {
    marginBottom: "30px",
    paddingBottom: "20px",
    borderBottom: "1px solid #eee",
  },
  email: {
    color: "#666",
    marginTop: "5px",
  },
  profileSection: {
    marginBottom: "30px",
  },
  infoRow: {
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "16px",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "500",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  editButton: {
    padding: "12px 24px",
    background: "#0059ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "500",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "20px",
  },
  saveButton: {
    padding: "12px 24px",
    background: "#0059ff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "500",
  },
  cancelButton: {
    padding: "12px 24px",
    background: "#ccc",
    color: "#333",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
  },
  error: {
    padding: "12px",
    background: "#fee",
    color: "#c33",
    borderRadius: "6px",
    marginBottom: "20px",
  },
  success: {
    padding: "12px",
    background: "#efe",
    color: "#3c3",
    borderRadius: "6px",
    marginBottom: "20px",
  },
};

