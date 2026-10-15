import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { registerCustomer } from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  // Controlled Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Controlled Input Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error as user types
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

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must contain at least 6 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{8,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
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
    setSuccessMessage("");

    try {
      const response = await registerCustomer({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });

      if (response.success) {
        setSuccessMessage("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      console.error("Registration error:", err);
      const message =
        err.response?.data?.message ||
        (err.response?.status === 409
          ? "Email already exists"
          : "Registration failed. Please try again.");
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
          maxWidth: "480px",
          padding: "2.5rem 2rem",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "0.5rem",
            }}
          >
            Create Your Account
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
            Join ShopKart today and experience seamless shopping
          </p>
        </div>

        {/* Server Success Banner */}
        {successMessage && (
          <div className="alert alert-success animate-fade-in" id="register-success-alert">
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Server Error Banner */}
        {serverError && (
          <div className="alert alert-error animate-fade-in" id="register-error-alert">
            <AlertCircle size={18} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="input-group">
            <label className="input-label" htmlFor="fullName">
              Full Name
            </label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                className={`form-input ${errors.fullName ? "has-error" : ""}`}
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>
            {errors.fullName && (
              <span className="error-text">
                <AlertCircle size={12} /> {errors.fullName}
              </span>
            )}
          </div>

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
                placeholder="At least 6 characters"
                className={`form-input ${errors.password ? "has-error" : ""}`}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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

          {/* Phone Number */}
          <div className="input-group">
            <label className="input-label" htmlFor="phone">
              Phone Number
            </label>
            <div className="input-wrapper">
              <Phone size={18} className="input-icon" />
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="9876543210"
                className={`form-input ${errors.phone ? "has-error" : ""}`}
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
            {errors.phone && (
              <span className="error-text">
                <AlertCircle size={12} /> {errors.phone}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            id="register-submit-btn"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: "1rem" }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
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
          Already have an account?{" "}
          <Link
            id="login-redirect-link"
            to="/login"
            style={{
              color: "#818cf8",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
