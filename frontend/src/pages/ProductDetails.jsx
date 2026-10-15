import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Tag,
  CheckCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { getProductById } from "../services/api";
import { useCart } from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getProductById(id);
        if (isMounted && data.success) {
          setProduct(data.product);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load product details");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const cartItem = cart.find(
    (i) => i.product?._id === id || i.product === id
  );
  const cartQty = cartItem ? cartItem.quantity : 0;
  const isAtMaxStock = product ? cartQty >= product.stock : false;

  const handleAddToCart = async () => {
    if (!product || adding || product.stock <= 0 || isAtMaxStock) return;
    setAdding(true);
    setCartError("");

    try {
      await addToCart(product._id);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2500);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setCartError(err.response?.data?.message || "Failed to add to cart");
        setTimeout(() => setCartError(""), 3500);
      }
    } finally {
      setAdding(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="page-wrapper" style={{ flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          Loading product details...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error || !product) {
    return (
      <div className="container" style={{ padding: "4rem 1.5rem" }}>
        <div
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
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            {error || "Product Not Found"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            The requested product could not be loaded or may no longer be available in our catalog.
          </p>
          <Link to="/products" className="btn-primary" style={{ textDecoration: "none" }}>
            <ArrowLeft size={16} />
            <span>Return to Products Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="btn-outline"
        style={{
          marginBottom: "2rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Catalog</span>
      </button>

      {/* Main Product Showcase Card */}
      <div
        className="glass-card animate-fade-in"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "3rem",
          padding: "2.5rem",
        }}
      >
        {/* Left Column: Large Product Image */}
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            border: "1px solid var(--border-subtle)",
            minHeight: "360px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            id="product-detail-image"
            src={product.image}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              maxHeight: "480px",
              objectFit: "cover",
            }}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";
            }}
          />

          {/* Stock Overlay Tag */}
          <span
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: isOutOfStock
                ? "rgba(239, 68, 68, 0.9)"
                : isLowStock
                  ? "rgba(245, 158, 11, 0.9)"
                  : "rgba(16, 185, 129, 0.9)",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "0.35rem 0.8rem",
              borderRadius: "8px",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {isOutOfStock ? "Out of Stock" : `${product.stock} Units in Stock`}
          </span>
        </div>

        {/* Right Column: Product Information */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {/* Category Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span
                id="product-detail-category"
                className="badge"
                style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                }}
              >
                <Tag size={12} /> {product.category}
              </span>
              <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>•</span>
              <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>ID: {product._id?.slice(-8)}</span>
            </div>

            {/* Product Name */}
            <h1
              id="product-detail-name"
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-main)",
                marginBottom: "1rem",
                lineHeight: 1.25,
              }}
            >
              {product.name}
            </h1>

            {/* Price */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "0.75rem",
                marginBottom: "1.5rem",
                paddingBottom: "1.5rem",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <span
                id="product-detail-price"
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color: "#818cf8",
                  letterSpacing: "-0.02em",
                }}
              >
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Inclusive of all taxes</span>
            </div>

            {/* Product Description */}
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
                Description
              </h3>
              <p
                id="product-detail-description"
                style={{
                  fontSize: "1rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                }}
              >
                {product.description}
              </p>
            </div>
          </div>

          {/* Action & Cart Section */}
          <div>
            {/* Added Feedback Alert */}
            {addedNotice && (
              <div className="alert alert-success animate-fade-in" style={{ marginBottom: "1rem" }}>
                <CheckCircle size={18} />
                <span>Product added to cart! ({cartQty} in cart)</span>
              </div>
            )}

            {cartError && (
              <div className="alert alert-error animate-fade-in" style={{ marginBottom: "1rem" }}>
                <AlertCircle size={18} />
                <span>{cartError}</span>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              id="add-to-cart-btn"
              onClick={handleAddToCart}
              className="btn-primary"
              disabled={isOutOfStock || isAtMaxStock || adding}
              style={{
                fontSize: "1.05rem",
                padding: "1rem 2rem",
                borderRadius: "12px",
                width: "100%",
                marginBottom: "1.5rem",
                background: isAtMaxStock
                  ? "rgba(100, 116, 139, 0.4)"
                  : cartQty > 0
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
              }}
            >
              {adding ? (
                <>
                  <span className="spinner" style={{ width: "1.1rem", height: "1.1rem" }} />
                  <span>Adding to Cart...</span>
                </>
              ) : isOutOfStock ? (
                <span>Out of Stock</span>
              ) : isAtMaxStock ? (
                <span>Maximum Stock in Cart ({cartQty})</span>
              ) : cartQty > 0 ? (
                <>
                  <ShoppingCart size={20} />
                  <span>Add Another to Cart ({cartQty} in Cart)</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid var(--border-subtle)",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                <Truck size={18} color="#06b6d4" />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  Free Shipping
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  Original Quality
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
                <RotateCcw size={18} color="#818cf8" />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                  7-Day Returns
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
