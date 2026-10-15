import React from "react";
import { User, Phone, MapPin, Building, Flag, Mailbox } from "lucide-react";

const CheckoutForm = ({ formData, setFormData, errors, disabled }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div
      style={{
        background: "rgba(17, 24, 39, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--text-main)",
          marginBottom: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <MapPin size={20} color="#6366f1" />
        Shipping Address
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Enter the delivery address where your order should be delivered.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Full Name */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            htmlFor="fullName"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}
          >
            Full Name *
          </label>
          <div style={{ position: "relative" }}>
            <User size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="checkout-fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={disabled}
              placeholder="e.g. Aarav Sharma"
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.6rem",
                borderRadius: "10px",
                border: `1px solid ${errors.fullName ? "#ef4444" : "var(--border-subtle)"}`,
                background: "rgba(11, 15, 25, 0.8)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
          {errors.fullName && (
            <span style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.3rem", display: "block" }}>
              {errors.fullName}
            </span>
          )}
        </div>

        {/* Phone Number */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            htmlFor="phone"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}
          >
            Phone Number (10 digits) *
          </label>
          <div style={{ position: "relative" }}>
            <Phone size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="checkout-phone"
              type="tel"
              name="phone"
              maxLength={10}
              value={formData.phone}
              onChange={handleChange}
              disabled={disabled}
              placeholder="9876543210"
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.6rem",
                borderRadius: "10px",
                border: `1px solid ${errors.phone ? "#ef4444" : "var(--border-subtle)"}`,
                background: "rgba(11, 15, 25, 0.8)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
          {errors.phone && (
            <span style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.3rem", display: "block" }}>
              {errors.phone}
            </span>
          )}
        </div>

        {/* Address Line 1 */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            htmlFor="addressLine1"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}
          >
            Street Address *
          </label>
          <div style={{ position: "relative" }}>
            <Building size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="checkout-addressLine1"
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              disabled={disabled}
              placeholder="Flat / House No., Building, Street"
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.6rem",
                borderRadius: "10px",
                border: `1px solid ${errors.addressLine1 ? "#ef4444" : "var(--border-subtle)"}`,
                background: "rgba(11, 15, 25, 0.8)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
          {errors.addressLine1 && (
            <span style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.3rem", display: "block" }}>
              {errors.addressLine1}
            </span>
          )}
        </div>

        {/* City */}
        <div>
          <label
            htmlFor="city"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}
          >
            City *
          </label>
          <input
            id="checkout-city"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g. Bengaluru"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: `1px solid ${errors.city ? "#ef4444" : "var(--border-subtle)"}`,
              background: "rgba(11, 15, 25, 0.8)",
              color: "var(--text-main)",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          {errors.city && (
            <span style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.3rem", display: "block" }}>
              {errors.city}
            </span>
          )}
        </div>

        {/* State */}
        <div>
          <label
            htmlFor="state"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}
          >
            State *
          </label>
          <input
            id="checkout-state"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={disabled}
            placeholder="e.g. Karnataka"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              border: `1px solid ${errors.state ? "#ef4444" : "var(--border-subtle)"}`,
              background: "rgba(11, 15, 25, 0.8)",
              color: "var(--text-main)",
              fontSize: "0.95rem",
              outline: "none",
            }}
          />
          {errors.state && (
            <span style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.3rem", display: "block" }}>
              {errors.state}
            </span>
          )}
        </div>

        {/* Pincode */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label
            htmlFor="pincode"
            style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.4rem" }}
          >
            Postal / PIN Code (6 digits) *
          </label>
          <div style={{ position: "relative" }}>
            <Mailbox size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              id="checkout-pincode"
              type="text"
              name="pincode"
              maxLength={6}
              value={formData.pincode}
              onChange={handleChange}
              disabled={disabled}
              placeholder="e.g. 560001"
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.6rem",
                borderRadius: "10px",
                border: `1px solid ${errors.pincode ? "#ef4444" : "var(--border-subtle)"}`,
                background: "rgba(11, 15, 25, 0.8)",
                color: "var(--text-main)",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
          </div>
          {errors.pincode && (
            <span style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.3rem", display: "block" }}>
              {errors.pincode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
