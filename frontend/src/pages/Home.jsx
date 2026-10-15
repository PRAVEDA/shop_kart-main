import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Sparkles,
  Lock,
  ArrowRight,
  Grid
} from "lucide-react";
import { getMyProfile, changeCustomerPassword } from "../services/api";

const Home = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(user || null);
  const [activeTab, setActiveTab] = useState("overview");

  // Bonus: Change Password State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Requirement: Call GET /customers/me
        const data = await getMyProfile();
        if (isMounted) {
          setProfile(data);
          if (setUser) setUser(data);
        }
      } catch (err) {
        console.error("Authentication check failed:", err);
        // Requirement: If Not Logged In -> Automatically redirect to /login
        if (isMounted) {
          if (setUser) setUser(null);
          navigate("/login");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, setUser]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!passwordForm.oldPassword) {
      setPwError("Current password is required");
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPwError("New password must contain at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }

    setPwLoading(true);
    try {
      const res = await changeCustomerPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.success) {
        setPwSuccess("Password updated successfully!");
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      setPwError(err.response?.data?.message || "Failed to update password");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Authenticating ShopKart customer...
        </p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Welcome Banner */}
      <div
        className="glass-card animate-fade-in"
        style={{
          padding: "2.5rem",
          marginBottom: "2rem",
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span className="badge badge-verified">
              <Shield size={12} /> Verified Customer
            </span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>•</span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>ShopKart Member</span>
          </div>

          <h1
            id="welcome-message"
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Welcome, <span style={{ color: "#818cf8" }}>{profile.fullName}</span>! 👋
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem", maxWidth: "600px" }}>
            You are securely logged into your ShopKart Customer Portal. Manage your profile, account security, and explore your shopping preferences below.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
          <Link
            id="home-explore-products-btn"
            to="/products"
            className="btn-primary"
            style={{
              textDecoration: "none",
              padding: "0.85rem 1.5rem",
              borderRadius: "12px",
              width: "auto",
            }}
          >
            <Grid size={18} />
            <span>Browse Products</span>
            <ArrowRight size={16} />
          </Link>

          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "12px",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid var(--border-subtle)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700 }}>
              Account ID
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontFamily: "monospace", marginTop: "0.2rem" }}>
              {profile._id ? profile._id.slice(-8).toUpperCase() : "ACTIVE"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "0.75rem",
        }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            background: activeTab === "overview" ? "rgba(99, 102, 241, 0.15)" : "transparent",
            color: activeTab === "overview" ? "#818cf8" : "var(--text-muted)",
            border: activeTab === "overview" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
            padding: "0.55rem 1.25rem",
            borderRadius: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
          }}
        >
          <User size={16} /> Customer Profile
        </button>

        <button
          onClick={() => setActiveTab("security")}
          style={{
            background: activeTab === "security" ? "rgba(99, 102, 241, 0.15)" : "transparent",
            color: activeTab === "security" ? "#818cf8" : "var(--text-muted)",
            border: activeTab === "security" ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
            padding: "0.55rem 1.25rem",
            borderRadius: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s",
          }}
        >
          <KeyRound size={16} /> Security & Password
        </button>
      </div>

      {/* Main Tab: Customer Information */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Card 1: Customer Details */}
          <div className="glass-card" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={20} color="#818cf8" />
              Customer Information
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
                  Customer Name
                </span>
                <p id="profile-fullname" style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-main)", marginTop: "0.2rem" }}>
                  {profile.fullName}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
                  Email Address
                </span>
                <p id="profile-email" style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--text-main)", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Mail size={16} color="var(--text-dim)" />
                  {profile.email}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>
                  Phone Number
                </span>
                <p id="profile-phone" style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--text-main)", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Phone size={16} color="var(--text-dim)" />
                  {profile.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Security & Session Status */}
          <div className="glass-card" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={20} color="#06b6d4" />
              Authentication & Cookie Status
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <CheckCircle size={20} color="#10b981" />
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#6ee7b7" }}>
                    HttpOnly Cookie Active
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    JWT session stored securely against XSS attacks
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <Sparkles size={20} color="#818cf8" />
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#a5b4fc" }}>
                    Protected Route Verified
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Loaded customer record via GET /customers/me
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: 600 }}>
                  MongoDB Object ID
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-main)", fontFamily: "monospace", marginTop: "0.25rem" }}>
                  {profile._id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Tab: Bonus Change Password */}
      {activeTab === "security" && (
        <div className="glass-card animate-fade-in" style={{ maxWidth: "560px", padding: "2.5rem 2rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <KeyRound size={22} color="#818cf8" />
            Change Account Password
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Verify your current password and create a new secure password (Bonus Feature).
          </p>

          {pwSuccess && (
            <div className="alert alert-success animate-fade-in">
              <CheckCircle size={18} />
              <span>{pwSuccess}</span>
            </div>
          )}

          {pwError && (
            <div className="alert alert-error animate-fade-in">
              <AlertCircle size={18} />
              <span>{pwError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <div className="input-group">
              <label className="input-label" htmlFor="oldPassword">
                Current Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="oldPassword"
                  type="password"
                  placeholder="Enter current password"
                  className="form-input"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="newPassword">
                New Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={pwLoading} style={{ marginTop: "1rem" }}>
              {pwLoading ? (
                <>
                  <span className="spinner" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Home;
