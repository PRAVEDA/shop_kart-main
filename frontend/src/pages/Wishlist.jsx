import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, RefreshCw, AlertCircle, ShoppingBag, Sparkles } from "lucide-react";
import WishlistCard from "../components/WishlistCard";
import { getWishlist, removeFromWishlist } from "../services/api";

const Wishlist = () => {
  const navigate = useNavigate();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWishlistData = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getWishlist();
      if (data && data.success) {
        setWishlistItems(data.wishlist || []);
      } else {
        setWishlistItems([]);
      }
    } catch (err) {
      console.error("Error loading wishlist:", err);
      if (err.response?.status === 401) {
        // Not logged in -> Redirect to login
        navigate("/login");
      } else {
        setError("We couldn't load your wishlist.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlistData();
  }, []);

  // Remove handler called by WishlistCard
  const handleRemoveItem = async (productId) => {
    await removeFromWishlist(productId);
    // Instant optimistic/state update without page reload
    setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      {/* Header Banner */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span
            className="badge"
            style={{
              background: "rgba(244, 63, 94, 0.15)",
              color: "#f43f5e",
              border: "1px solid rgba(244, 63, 94, 0.3)",
            }}
          >
            <Heart size={13} fill="#f43f5e" /> Saved Collections
          </span>
        </div>
        <h1
          id="wishlist-title"
          style={{
            fontSize: "2.25rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "0.5rem",
          }}
        >
          My Wishlist
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
          {wishlistItems.length} {wishlistItems.length === 1 ? "product saved" : "products saved"}
        </p>
      </div>

      {/* 1. LOADING STATE */}
      {loading && (
        <div
          id="wishlist-loading-state"
          className="glass-card"
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
          }}
        >
          <div className="spinner" style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px" }} />
          <p style={{ color: "var(--text-main)", fontSize: "1.1rem", fontWeight: 600 }}>
            Loading your wishlist...
          </p>
          <p style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>
            Retrieving your saved items from ShopKart
          </p>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {!loading && error && (
        <div
          id="wishlist-error-state"
          className="glass-card"
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            borderColor: "rgba(239, 68, 68, 0.3)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(239, 68, 68, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ef4444",
            }}
          >
            <AlertCircle size={28} />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>Something went wrong.</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.925rem", maxWidth: "450px" }}>
            {error}
          </p>
          <button
            id="wishlist-retry-btn"
            onClick={fetchWishlistData}
            className="btn-outline"
            style={{ marginTop: "0.5rem" }}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* 3. EMPTY STATE */}
      {!loading && !error && wishlistItems.length === 0 && (
        <div
          id="wishlist-empty-state"
          className="glass-card"
          style={{
            padding: "4.5rem 2rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "20px",
              background: "rgba(244, 63, 94, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f43f5e",
            }}
          >
            <Heart size={32} fill="#f43f5e" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Your wishlist is empty</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", maxWidth: "380px" }}>
            Save products you love and find them here later when you are ready to shop.
          </p>
          <Link
            id="browse-products-btn"
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
      )}

      {/* 4. SUCCESS: DYNAMIC WISHLIST PRODUCT GRID */}
      {!loading && !error && wishlistItems.length > 0 && (
        <div
          id="wishlist-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.75rem",
          }}
        >
          {wishlistItems.map((product) => (
            <WishlistCard
              key={product._id}
              product={product}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
