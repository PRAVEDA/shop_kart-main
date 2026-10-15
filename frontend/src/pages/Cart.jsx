import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, error, subtotal, totalUnits, itemCount, fetchCart } = useCart();

  // 1. LOADING STATE
  if (loading && cart.length === 0) {
    return (
      <div className="page-wrapper" style={{ flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px" }} />
        <p style={{ color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 600 }}>
          Loading your cart...
        </p>
        <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>
          Retrieving your current items and stock status
        </p>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error && cart.length === 0) {
    return (
      <div className="container" style={{ padding: "4rem 1.5rem" }}>
        <div
          id="cart-error-state"
          className="glass-card"
          style={{
            maxWidth: "500px",
            margin: "0 auto",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "#ef4444",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Unable to load your cart.
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {error || "An error occurred while communicating with the cart service."}
          </p>
          <button
            onClick={fetchCart}
            className="btn-primary"
            style={{ width: "auto", margin: "0 auto" }}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
  if (!loading && cart.length === 0) {
    return (
      <div className="container" style={{ padding: "4rem 1.5rem" }}>
        <div
          id="cart-empty-state"
          className="glass-card"
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            padding: "4rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "20px",
              background: "rgba(99, 102, 241, 0.12)",
              color: "#818cf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCart size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Your cart is empty 🛒</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "380px" }}>
            Looks like you haven't added anything yet. Discover our premium products and start building your order.
          </p>
          <Link
            id="cart-browse-products-btn"
            to="/products"
            className="btn-primary"
            style={{
              textDecoration: "none",
              width: "auto",
              padding: "0.75rem 1.75rem",
              borderRadius: "12px",
              marginTop: "0.5rem",
            }}
          >
            <ShoppingBag size={18} />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  // 4. MAIN CART VIEW WITH ORDER SUMMARY
  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span
            className="badge"
            style={{
              background: "rgba(99, 102, 241, 0.15)",
              color: "#818cf8",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <Sparkles size={12} /> Active Shopping Bag
          </span>
        </div>
        <h1
          id="cart-title"
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}
        >
          My Cart
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Review your items ({totalUnits} total {totalUnits === 1 ? "unit" : "units"} across {itemCount} {itemCount === 1 ? "product" : "products"})
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Cart Items List */}
        <div style={{ flex: "1 1 540px" }}>
          <div id="cart-items-list">
            {cart.map((item) => (
              <CartItem key={item.product?._id || item._id} item={item} />
            ))}
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <Link
              to="/products"
              className="btn-outline"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ShoppingBag size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div
          className="glass-card"
          style={{
            position: "sticky",
            top: "92px",
            padding: "2rem",
            background: "rgba(17, 24, 39, 0.85)",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              marginBottom: "1.5rem",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            Order Summary
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              <span>Total Items:</span>
              <span id="summary-items-count" style={{ color: "var(--text-main)", fontWeight: 600 }}>
                {totalUnits} units
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              <span>Subtotal:</span>
              <span id="summary-subtotal" style={{ color: "var(--text-main)", fontWeight: 700 }}>
                ₹{Number(subtotal).toLocaleString("en-IN")}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              <span>Delivery / Shipping:</span>
              <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Truck size={15} /> FREE
              </span>
            </div>

            <div
              style={{
                paddingTop: "1rem",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>Estimated Total:</span>
              <span
                id="summary-total"
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 800,
                  color: "#818cf8",
                  letterSpacing: "-0.02em",
                }}
              >
                ₹{Number(subtotal).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Proceed to Checkout CTA */}
          <button
            id="proceed-to-checkout-btn"
            onClick={() => navigate("/checkout")}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "0.95rem 1.5rem",
              borderRadius: "12px",
              fontSize: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={18} />
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              fontSize: "0.775rem",
              color: "var(--text-dim)",
            }}
          >
            <ShieldCheck size={15} color="#10b981" />
            <span>Secure 256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
