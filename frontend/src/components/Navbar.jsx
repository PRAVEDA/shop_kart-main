import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag, LogOut, User, LogIn, UserPlus, Grid, Heart, ShoppingCart, Package } from "lucide-react";
import { logoutCustomer, getWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalUnits } = useCart();
  const [wishlistCount, setWishlistCount] = useState(0);

  // Fetch Wishlist count for logged in customer (Lab 04)
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      if (user) {
        try {
          const data = await getWishlist();
          if (isMounted && data && data.success) {
            setWishlistCount(data.count || 0);
          }
        } catch (err) {
          // If unauthenticated or error, ignore
        }
      } else {
        if (isMounted) setWishlistCount(0);
      }
    };

    fetchCount();
    return () => {
      isMounted = false;
    };
  }, [user, location.pathname]);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
    } catch (error) {
      console.error("Logout request error:", error);
    } finally {
      // Clear client user state and redirect to login
      if (setUser) setUser(null);
      navigate("/login");
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        backgroundColor: "rgba(11, 15, 25, 0.8)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "72px",
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/products"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            textDecoration: "none",
            color: "var(--text-main)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px var(--primary-glow)",
            }}
          >
            <ShoppingBag size={22} color="#ffffff" />
          </div>
          <span
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Shop<span style={{ color: "#6366f1", WebkitTextFillColor: "#6366f1" }}>Kart</span>
          </span>
        </Link>

        {/* Navigation & User Actions */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Products Catalog Link */}
          <Link
            id="nav-products-link"
            to="/products"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              textDecoration: "none",
              color: location.pathname.startsWith("/products") ? "#818cf8" : "var(--text-muted)",
              fontSize: "0.9rem",
              fontWeight: 600,
              padding: "0.45rem 0.8rem",
              borderRadius: "8px",
              background: location.pathname.startsWith("/products") ? "rgba(99, 102, 241, 0.12)" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <Grid size={16} />
            <span>Products</span>
          </Link>

          {/* Wishlist Link */}
          <Link
            id="nav-wishlist-link"
            to="/wishlist"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              textDecoration: "none",
              color: location.pathname === "/wishlist" ? "#f43f5e" : "var(--text-muted)",
              fontSize: "0.9rem",
              fontWeight: 600,
              padding: "0.45rem 0.8rem",
              borderRadius: "8px",
              background: location.pathname === "/wishlist" ? "rgba(244, 63, 94, 0.12)" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <Heart
              size={16}
              color={location.pathname === "/wishlist" ? "#f43f5e" : "var(--text-muted)"}
              fill={location.pathname === "/wishlist" ? "#f43f5e" : "none"}
            />
            <span>Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}</span>
          </Link>

          {/* Shopping Cart Link (Lab 05: Dynamic Cart Count) */}
          <Link
            id="nav-cart-link"
            to="/cart"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              textDecoration: "none",
              color: location.pathname === "/cart" ? "#818cf8" : "var(--text-muted)",
              fontSize: "0.9rem",
              fontWeight: 600,
              padding: "0.45rem 0.8rem",
              borderRadius: "8px",
              background: location.pathname === "/cart" ? "rgba(99, 102, 241, 0.15)" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <ShoppingCart size={16} color={location.pathname === "/cart" ? "#818cf8" : "var(--text-muted)"} />
            <span>Cart {totalUnits > 0 ? `(${totalUnits})` : ""}</span>
          </Link>

          {user ? (
            <>
              {/* My Orders Link (Lab 06) */}
              <Link
                id="nav-orders-link"
                to="/orders"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  textDecoration: "none",
                  color: location.pathname.startsWith("/orders") ? "#818cf8" : "var(--text-muted)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  padding: "0.45rem 0.8rem",
                  borderRadius: "8px",
                  background: location.pathname.startsWith("/orders") ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <Package size={16} color={location.pathname.startsWith("/orders") ? "#818cf8" : "var(--text-muted)"} />
                <span>Orders</span>
              </Link>

              {/* Home / Profile Link */}
              <Link
                id="nav-profile-link"
                to="/home"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  textDecoration: "none",
                  color: location.pathname === "/home" ? "#818cf8" : "var(--text-muted)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  padding: "0.45rem 0.8rem",
                  borderRadius: "8px",
                  background: location.pathname === "/home" ? "rgba(99, 102, 241, 0.12)" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                <User size={16} />
                <span>{user.fullName || "My Profile"}</span>
              </Link>

              {/* Logout Button */}
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="btn-outline"
                style={{
                  color: "#f87171",
                  borderColor: "rgba(239, 68, 68, 0.2)",
                  background: "rgba(239, 68, 68, 0.05)",
                  cursor: "pointer",
                }}
                title="Log out of your account"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                id="nav-login-btn"
                to="/login"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  textDecoration: "none",
                  color: location.pathname === "/login" ? "#818cf8" : "var(--text-muted)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  transition: "color 0.2s",
                }}
              >
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>

              <Link
                id="nav-register-btn"
                to="/register"
                className="btn-primary"
                style={{
                  width: "auto",
                  padding: "0.55rem 1.15rem",
                  fontSize: "0.875rem",
                  textDecoration: "none",
                }}
              >
                <UserPlus size={16} />
                <span>Create Account</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
