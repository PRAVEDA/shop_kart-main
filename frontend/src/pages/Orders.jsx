import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  Truck,
  CheckCircle2
} from "lucide-react";
import { getMyOrders } from "../services/api";
import { getProductImageSource, handleProductImageError } from "../services/productImages";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyOrders();
      if (data && data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
      setError(err.response?.data?.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="page-wrapper" style={{ flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading your orders...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="page-wrapper">
        <div
          style={{
            maxWidth: "480px",
            margin: "4rem auto",
            textAlign: "center",
            padding: "2.5rem",
            background: "rgba(17, 24, 39, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <AlertCircle size={28} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Unable to Load Orders
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {error}
          </p>
          <button onClick={fetchOrders} className="btn-primary" style={{ padding: "0.75rem 1.75rem" }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!orders || orders.length === 0) {
    return (
      <div className="page-wrapper">
        <div
          style={{
            maxWidth: "480px",
            margin: "4rem auto",
            textAlign: "center",
            padding: "3rem 2rem",
            background: "rgba(17, 24, 39, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <Package size={32} color="#818cf8" />
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            You have not placed any orders yet.
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            Discover our curated catalogue of top-tier products and complete your first checkout!
          </p>
          <Link
            to="/products"
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
              padding: "0.8rem 1.8rem",
            }}
          >
            <ShoppingBag size={18} />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ alignItems: "flex-start", padding: "2.5rem 1rem" }}>
      <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-main)",
              marginBottom: "0.4rem",
            }}
          >
            My Orders
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            View and track your previous orders and payment receipts ({orders.length} orders placed).
          </p>
        </div>

        {/* Orders List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const totalItemsCount = order.items?.reduce((sum, it) => sum + it.quantity, 0) || 0;

            return (
              <div
                key={order._id}
                style={{
                  background: "rgba(17, 24, 39, 0.7)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "1.75rem",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem",
                    paddingBottom: "1.25rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#818cf8",
                        display: "block",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Order #{order._id}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      <Calendar size={14} />
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{totalItemsCount} {totalItemsCount === 1 ? "unit" : "units"}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {/* Status Badge */}
                    <span
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        background:
                          order.status === "DELIVERED"
                            ? "rgba(16, 185, 129, 0.15)"
                            : "rgba(99, 102, 241, 0.15)",
                        color: order.status === "DELIVERED" ? "#34d399" : "#818cf8",
                        border: `1px solid ${order.status === "DELIVERED"
                            ? "rgba(16, 185, 129, 0.3)"
                            : "rgba(99, 102, 241, 0.3)"
                          }`,
                      }}
                    >
                      {order.status}
                    </span>

                    {/* Payment Badge */}
                    <span
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        background:
                          order.paymentStatus === "PAID"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                        color: order.paymentStatus === "PAID" ? "#34d399" : "#f87171",
                        border: `1px solid ${order.paymentStatus === "PAID"
                            ? "rgba(16, 185, 129, 0.25)"
                            : "rgba(239, 68, 68, 0.25)"
                          }`,
                      }}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Items Preview Row */}
                <div
                  style={{
                    padding: "1.25rem 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                    {order.items?.slice(0, 4).map((it, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          position: "relative",
                        }}
                        title={`${it.name} (Qty: ${it.quantity})`}
                      >
                        <img
                          src={getProductImageSource(it.image)}
                          alt={it.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={handleProductImageError}
                        />
                        {it.quantity > 1 && (
                          <span
                            style={{
                              position: "absolute",
                              bottom: "2px",
                              right: "2px",
                              background: "rgba(0, 0, 0, 0.8)",
                              color: "#ffffff",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "1px 4px",
                              borderRadius: "4px",
                            }}
                          >
                            ×{it.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        +{order.items.length - 4} more
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "block" }}>
                      Total Amount
                    </span>
                    <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-main)" }}>
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Footer Link */}
                <div
                  style={{
                    paddingTop: "1rem",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Link
                    to={`/orders/${order._id}`}
                    className="btn-outline"
                    style={{
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      padding: "0.5rem 1rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span>View Details</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Orders;
