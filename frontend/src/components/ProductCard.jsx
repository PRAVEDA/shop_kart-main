import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Tag, Heart, ShoppingCart, AlertCircle, Plus } from "lucide-react";
import { toggleWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product, isInitiallyWishlisted = false, onWishlistChange }) => {
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();

  // Wishlist Interaction States
  const [isWishlisted, setIsWishlisted] = useState(isInitiallyWishlisted);
  const [savingWishlist, setSavingWishlist] = useState(false);

  // Cart Interaction States
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccessNotice, setCartSuccessNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  // Check if item is already in global cart
  const cartItem = cart.find(
    (i) => i.product?._id === product._id || i.product === product._id
  );
  const cartQty = cartItem ? cartItem.quantity : 0;
  const isAtMaxStock = cartQty >= product.stock;

  // Handle Wishlist Toggle
  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (savingWishlist) return;
    setSavingWishlist(true);
    setErrorMessage("");

    try {
      const res = await toggleWishlist(product._id);
      if (res && res.success) {
        setIsWishlisted(res.saved);
        if (onWishlistChange) onWishlistChange(product._id, res.saved);
      }
    } catch (err) {
      console.error("Wishlist action failed:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setErrorMessage("Unable to save product.");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } finally {
      setSavingWishlist(false);
    }
  };

  // Handle Add to Cart
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (addingToCart || isOutOfStock || isAtMaxStock) return;
    setAddingToCart(true);
    setErrorMessage("");

    try {
      await addToCart(product._id);
      setCartSuccessNotice(true);
      setTimeout(() => setCartSuccessNotice(false), 2000);
    } catch (err) {
      console.error("Add to cart error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setErrorMessage(err.response?.data?.message || "Failed to add to cart");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div
      className="glass-card product-card animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
        position: "relative",
      }}
    >
      {/* Product Image Container */}
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

        {/* Wishlist Heart Toggle */}
        <button
          onClick={handleWishlistClick}
          disabled={savingWishlist}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: savingWishlist ? "wait" : "pointer",
            zIndex: 2,
            transition: "transform 0.2s",
          }}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart
            size={18}
            color={isWishlisted ? "#f43f5e" : "#e2e8f0"}
            fill={isWishlisted ? "#f43f5e" : "none"}
          />
        </button>

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

      {/* Product Details Section */}
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

          {errorMessage && (
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
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Actions: [ View Details ] & [ Add to Cart ] */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
          <Link
            to={`/products/${product._id}`}
            className="btn-outline"
            style={{
              textDecoration: "none",
              fontSize: "0.825rem",
              padding: "0.6rem 0.5rem",
              borderRadius: "10px",
              justifyContent: "center",
            }}
          >
            <Eye size={15} />
            <span>Details</span>
          </Link>

          {/* Add to Cart Button (Task 7) */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || isOutOfStock || isAtMaxStock}
            className="btn-primary"
            style={{
              fontSize: "0.825rem",
              padding: "0.6rem 0.5rem",
              borderRadius: "10px",
              justifyContent: "center",
              cursor: addingToCart || isOutOfStock || isAtMaxStock ? "not-allowed" : "pointer",
              background: isAtMaxStock
                ? "rgba(100, 116, 139, 0.4)"
                : cartQty > 0
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
            }}
            title={
              isOutOfStock
                ? "Out of stock"
                : isAtMaxStock
                ? "Max stock already in cart"
                : cartQty > 0
                ? "Add another unit"
                : "Add product to cart"
            }
          >
            {addingToCart ? (
              <>
                <span className="spinner" style={{ width: "0.85rem", height: "0.85rem" }} />
                <span>Adding...</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isAtMaxStock ? (
              <span>Max in Cart</span>
            ) : cartQty > 0 ? (
              <>
                <Plus size={14} />
                <span>Add Another ({cartQty})</span>
              </>
            ) : (
              <>
                <ShoppingCart size={15} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
