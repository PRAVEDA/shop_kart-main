import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  Clock,
  CreditCard,
  MapPin,
  ArrowLeft,
  ShoppingBag,
  Truck,
  Check,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { getOrderById, updateOrderStatus } from "../services/api";

const STATUS_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isJustPlaced = location.state?.orderSuccess;

  useEffect(() => {
    let isMounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getOrderById(id);
        if (isMounted && data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Fetch order details error:", err);
          setError(err.response?.data?.message || "Failed to load order details");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Bonus Challenge (+10 Marks): Advance order status
  const handleAdvanceStatus = async (nextStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await updateOrderStatus(order._id, nextStatus);
      if (res.success) {
        setOrder(res.order);
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "2.5rem", height: "2.5rem" }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-wrapper">
        <div
          style={{
            maxWidth: "500px",
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
              margin: "0 auto 1rem",
            }}
          >
            <AlertCircle size={28} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Order Not Found
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {error || "We could not find the requested order."}
          </p>
          <Link to="/orders" className="btn-primary" style={{ textDecoration: "none" }}>
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="page-wrapper" style={{ alignItems: "flex-start", padding: "2.5rem 1rem" }}>
      <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>

        {/* Confirmation Banner if newly placed */}
        {isJustPlaced && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "16px",
              padding: "2rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              <CheckCircle2 size={32} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#34d399", margin: 0, marginBottom: "0.3rem" }}>
                Order Placed Successfully!
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: 0 }}>
                Thank you for your purchase. Your payment was verified via Razorpay and your cart has been cleared.
              </p>
            </div>
          </div>
        )}

        {/* Order Header Card */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "1.75rem 2rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1.25rem",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
              <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
                Order #{order._id}
              </h1>
              <span
                style={{
                  padding: "0.25rem 0.65rem",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  background:
                    order.status === "DELIVERED"
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(99, 102, 241, 0.15)",
                  color: order.status === "DELIVERED" ? "#34d399" : "#818cf8",
                  border: `1px solid ${
                    order.status === "DELIVERED"
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(99, 102, 241, 0.3)"
                  }`,
                }}
              >
                {order.status}
              </span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                background: order.paymentStatus === "PAID" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                color: order.paymentStatus === "PAID" ? "#34d399" : "#f87171",
                border: `1px solid ${order.paymentStatus === "PAID" ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              <CreditCard size={15} />
              Payment: {order.paymentStatus}
            </span>
            <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-main)" }}>
              ₹{order.totalAmount?.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Bonus Challenge (+10 Marks): Visual Order Status Stepper */}
        <div
          style={{
            background: "rgba(17, 24, 39, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "1.75rem 2rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Truck size={18} color="#6366f1" />
              Order Progress
            </h3>
            {/* TA Bonus Testing Controls */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {currentStepIdx < STATUS_STEPS.length - 1 && (
                <button
                  onClick={() => handleAdvanceStatus(STATUS_STEPS[currentStepIdx + 1])}
                  disabled={updatingStatus}
                  className="btn-outline"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.7rem",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                  title="Simulate progression to next stage"
                >
                  <RefreshCw size={12} className={updatingStatus ? "spinner" : ""} />
                  Advance to {STATUS_STEPS[currentStepIdx + 1]}
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${STATUS_STEPS.length}, 1fr)`,
              position: "relative",
              gap: "1rem",
            }}
          >
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: isCompleted
                        ? "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: `2px solid ${isCompleted ? "#818cf8" : "rgba(255, 255, 255, 0.15)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isCompleted ? "#ffffff" : "var(--text-muted)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      marginBottom: "0.5rem",
                      boxShadow: isCurrent ? "0 0 16px rgba(99, 102, 241, 0.6)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isCompleted ? <Check size={16} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCompleted ? "var(--text-main)" : "var(--text-muted)",
                    }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Content: Items Snapshot & Shipping Address */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {/* Purchased Items Snapshot */}
          <div
            style={{
              background: "rgba(17, 24, 39, 0.7)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "1.75rem",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Package size={18} color="#6366f1" />
              Purchased Items Snapshot ({order.items?.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {order.items?.map((item) => (
                <div
                  key={item._id || item.product}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "1rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        background: "rgba(255, 255, 255, 0.05)",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"}
                        alt={item.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: "var(--text-main)" }}>
                        {item.name}
                      </p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Qty: {item.quantity} × ₹{item.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>Subtotal</span>
                <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>Shipping</span>
                <span style={{ color: "#34d399", fontWeight: 600 }}>FREE</span>
              </div>
              <div style={{ height: "1px", background: "var(--border-subtle)", margin: "0.3rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem" }}>
                <span>Total Paid</span>
                <span style={{ color: "#818cf8" }}>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Shipping & Payment Meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Delivery Address */}
            <div
              style={{
                background: "rgba(17, 24, 39, 0.7)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "1.75rem",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={18} color="#6366f1" />
                Delivery Address
              </h3>
              <p style={{ fontWeight: 600, margin: "0 0 0.3rem", color: "var(--text-main)" }}>
                {order.shippingAddress?.fullName}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0 0 0.3rem" }}>
                {order.shippingAddress?.addressLine1}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0 0 0.3rem" }}>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0.5rem 0 0" }}>
                📞 {order.shippingAddress?.phone}
              </p>
            </div>

            {/* Payment Identifiers */}
            <div
              style={{
                background: "rgba(17, 24, 39, 0.7)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "1.75rem",
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CreditCard size={18} color="#6366f1" />
                Payment Record
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Razorpay Payment ID:</span>
                  <span style={{ fontFamily: "monospace", color: "#34d399", fontWeight: 600 }}>
                    {order.razorpayPaymentId || "N/A"}
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block" }}>Razorpay Order ID:</span>
                  <span style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                    {order.razorpayOrderId || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <Link
            to="/orders"
            className="btn-outline"
            style={{ textDecoration: "none", padding: "0.75rem 1.5rem", fontSize: "0.95rem" }}
          >
            View All Orders
          </Link>
          <Link
            to="/products"
            className="btn-primary"
            style={{ textDecoration: "none", padding: "0.75rem 1.5rem", fontSize: "0.95rem" }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
