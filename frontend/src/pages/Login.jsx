import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { loginCustomer, getMyProfile } from "../services/api";

const Login = ({ setUser }) => {
  const navigate = useNavigate();

  // Controlled Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Controlled Input Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (serverError) setServerError("");
  };

  // Client-side Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setServerError("");

    try {
      // 1. Call login API (sets HttpOnly cookie)
      const response = await loginCustomer({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.success) {
        // If login returned customer data directly, update state
        if (response.customer && setUser) {
          setUser(response.customer);
        } else {
          // Alternatively fetch profile immediately
          try {
            const profile = await getMyProfile();
            if (setUser) setUser(profile);
          } catch (profileErr) {
            console.warn("Profile fetch after login:", profileErr);
          }
        }

        // Navigate to protected /home
        navigate("/home");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Requirement: Show "Invalid Credentials" on failure
      const message =
        err.response?.status === 401
          ? "Invalid Credentials"
          : err.response?.data?.message || "Invalid Credentials";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div
        className="glass-card animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "2.5rem 2rem",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
            Enter your credentials to access your ShopKart account
          </p>
        </div>

        {/* Server Error / "Invalid Credentials" Banner */}
        {serverError && (
          <div className="alert alert-error animate-fade-in" id="login-error-alert">
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="input-group">
            <label className="input-label" htmlFor="email">
              Email Address
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="john@gmail.com"
                className={`form-input ${errors.email ? "has-error" : ""}`}
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <span className="error-text">
                <AlertCircle size={12} /> {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`form-input ${errors.password ? "has-error" : ""}`}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">
                <AlertCircle size={12} /> {errors.password}
              </span>
            )}
          </div>

          {/* Login Button */}
          <button
            id="login-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In to ShopKart</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "1.75rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "0.9rem",
            color: "var(--text-muted)",
          }}
        >
          Don't have an account?{" "}
          <Link
            id="register-redirect-link"
            to="/register"
            style={{
              color: "#818cf8",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
