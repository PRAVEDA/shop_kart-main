import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Eye, Tag, AlertCircle } from "lucide-react";

const WishlistCard = ({ product, onRemove }) => {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    setError("");

    try {
      await onRemove(product._id);
    } catch (err) {
      console.error("Failed to remove item:", err);
      setError("Unable to remove. Please try again.");
      setRemoving(false);
    }
  };

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Product Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "70%",
          overflow: "hidden",
          backgroundColor: "rgba(15, 23, 42, 0.6)",
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";
          }}
        />

        {/* Category Pill Tag */}
        <span
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#e2e8f0",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.25rem 0.65rem",
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            zIndex: 2,
          }}
        >
          <Tag size={12} color="#818cf8" />
          {product.category}
        </span>

        {/* Stock Badge */}
        <span
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            background: isOutOfStock
              ? "rgba(239, 68, 68, 0.85)"
              : isLowStock
              ? "rgba(245, 158, 11, 0.85)"
              : "rgba(16, 185, 129, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#ffffff",
            fontSize: "0.725rem",
            fontWeight: 700,
            padding: "0.2rem 0.6rem",
            borderRadius: "6px",
            zIndex: 2,
          }}
        >
          {isOutOfStock ? "Out of Stock" : `${product.stock} units left`}
        </span>
      </div>

      {/* Product Content */}
      <div
        style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: "0.4rem",
              lineHeight: 1.35,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </h3>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.5rem",
              margin: "0.6rem 0 1rem 0",
            }}
          >
            <span
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#818cf8",
                letterSpacing: "-0.02em",
              }}
            >
              ₹{Number(product.price).toLocaleString("en-IN")}
            </span>
          </div>

          {error && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "#fca5a5",
                marginBottom: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Buttons: [ View Details ] & [ Remove from Wishlist ] */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <Link
            to={`/products/${product._id}`}
            className="btn-primary"
            style={{
              textDecoration: "none",
              fontSize: "0.875rem",
              padding: "0.6rem 1rem",
              borderRadius: "10px",
            }}
          >
            <Eye size={16} />
            <span>View Details</span>
          </Link>

          <button
            onClick={handleRemove}
            disabled={removing}
            className="btn-outline"
            style={{
              width: "100%",
              justifyContent: "center",
              fontSize: "0.85rem",
              padding: "0.55rem 1rem",
              borderRadius: "10px",
              color: "#f87171",
              borderColor: "rgba(239, 68, 68, 0.25)",
              background: "rgba(239, 68, 68, 0.05)",
              cursor: removing ? "not-allowed" : "pointer",
            }}
          >
            {removing ? (
              <>
                <span className="spinner" style={{ width: "1rem", height: "1rem" }} />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Remove from Wishlist</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
