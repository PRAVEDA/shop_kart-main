import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, AlertCircle } from "lucide-react";
import { useCart } from "../context/CartContext";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const product = item.product || {};

  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const maxStock = product.stock || 0;
  const isAtMaxStock = item.quantity >= maxStock;

  const handleDecrease = async () => {
    if (item.quantity <= 1 || updating || removing) return;
    setUpdating(true);
    setErrorMsg("");
    try {
      await updateQuantity(product._id, item.quantity - 1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdating(false);
    }
  };

  const handleIncrease = async () => {
    if (isAtMaxStock || updating || removing) return;
    setUpdating(true);
    setErrorMsg("");
    try {
      await updateQuantity(product._id, item.quantity + 1);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    setErrorMsg("");
    try {
      await removeFromCart(product._id);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to remove item");
      setRemoving(false);
    }
  };

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: "1.25rem",
        marginBottom: "1rem",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.25rem",
      }}
    >
      {/* Product Image and Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: "1 1 260px" }}>
        <Link
          to={`/products/${product._id}`}
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "10px",
            overflow: "hidden",
            flexShrink: 0,
            background: "rgba(15, 23, 42, 0.6)",
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";
            }}
          />
        </Link>

        <div>
          <Link
            to={`/products/${product._id}`}
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--text-main)",
              textDecoration: "none",
              display: "block",
              marginBottom: "0.25rem",
            }}
          >
            {product.name}
          </Link>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Unit Price: <span style={{ color: "#818cf8", fontWeight: 600 }}>₹{Number(product.price).toLocaleString("en-IN")}</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
            {maxStock} units available in stock
          </div>
        </div>
      </div>

      {/* Quantity Controls: [-] Qty [+] */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={handleDecrease}
            disabled={item.quantity <= 1 || updating || removing}
            style={{
              padding: "0.5rem 0.75rem",
              background: "transparent",
              border: "none",
              color: item.quantity <= 1 ? "var(--text-dim)" : "var(--text-main)",
              cursor: item.quantity <= 1 || updating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Decrease quantity"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>

          <span
            style={{
              padding: "0.4rem 0.9rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              minWidth: "36px",
              textAlign: "center",
              color: "var(--text-main)",
              borderLeft: "1px solid var(--border-subtle)",
              borderRight: "1px solid var(--border-subtle)",
            }}
          >
            {updating ? "..." : item.quantity}
          </span>

          <button
            onClick={handleIncrease}
            disabled={isAtMaxStock || updating || removing}
            style={{
              padding: "0.5rem 0.75rem",
              background: "transparent",
              border: "none",
              color: isAtMaxStock ? "var(--text-dim)" : "var(--text-main)",
              cursor: isAtMaxStock || updating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={isAtMaxStock ? "Max stock reached" : "Increase quantity"}
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        {isAtMaxStock && (
          <span style={{ fontSize: "0.72rem", color: "#f59e0b" }}>
            Max available stock
          </span>
        )}
      </div>

      {/* Item Total Price */}
      <div style={{ textAlign: "right", minWidth: "110px" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
          Item Total
        </div>
        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#818cf8" }}>
          ₹{Number(product.price * item.quantity).toLocaleString("en-IN")}
        </div>
      </div>

      {/* Remove Button */}
      <div>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="btn-outline"
          style={{
            padding: "0.5rem 0.85rem",
            color: "#f87171",
            borderColor: "rgba(239, 68, 68, 0.2)",
            background: "rgba(239, 68, 68, 0.05)",
            cursor: removing ? "not-allowed" : "pointer",
          }}
          title="Remove from cart"
        >
          {removing ? (
            <span className="spinner" style={{ width: "0.9rem", height: "0.9rem" }} />
          ) : (
            <Trash2 size={16} />
          )}
          <span style={{ fontSize: "0.85rem" }}>Remove</span>
        </button>
      </div>

      {errorMsg && (
        <div style={{ width: "100%", fontSize: "0.8rem", color: "#f87171", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default CartItem;
