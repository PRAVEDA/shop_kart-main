import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, CreditCard, AlertCircle, Lock, Zap } from "lucide-react";
import CheckoutForm from "../components/CheckoutForm";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment } from "../services/api";
import { getProductImageSource, handleProductImageError } from "../services/productImages";

let razorpayScriptPromise = null;

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      const loaded = Boolean(window.Razorpay);
      if (!loaded) razorpayScriptPromise = null;
      resolve(loaded);
    };
    script.onerror = () => {
      script.remove();
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};

const Checkout = ({ user }) => {
  const navigate = useNavigate();
  const { cart, subtotal, totalUnits, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [serverError, setServerError] = useState("");
  const checkoutInProgressRef = useRef(false);
  const verificationStartedRef = useRef(false);
  const [checkoutRequestId] = useState(() => window.crypto.randomUUID());

  // Pre-load Razorpay script on mount
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  useEffect(() => {
    if (!user) return;
    const digits = String(user.phone || "").replace(/\D/g, "").slice(-10);
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName || "",
      phone: prev.phone || digits,
    }));
  }, [user]);

  // Form Validation (Task 3)
  const validateForm = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = "Full name is required";
    if (!formData.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^[6-9][0-9]{9}$/.test(formData.phone.trim())) {
      errs.phone = "Enter a valid 10-digit Indian mobile number";
    }

    if (!formData.addressLine1.trim()) errs.addressLine1 = "Street address is required";
    if (!formData.city.trim()) errs.city = "City is required";
    if (!formData.state.trim()) errs.state = "State is required";
    if (!formData.pincode.trim()) {
      errs.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      errs.pincode = "Pincode must be exactly 6 digits";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Complete Payment Verification Flow (Step 11 & 13)
  const handlePaymentSuccess = async (paymentDetails) => {
    if (verificationStartedRef.current) return;
    verificationStartedRef.current = true;
    setVerifying(true);
    setServerError("");
    try {
      const verifyRes = await verifyPayment(paymentDetails);
      if (!verifyRes.success) {
        throw new Error(verifyRes.message || "Payment verification failed");
      }

      clearCart();
      navigate(`/orders/${paymentDetails.shopKartOrderId}`, {
        state: {
          orderSuccess: true,
          order: verifyRes.order,
        },
      });
    } catch (err) {
      console.error("Payment verification error:", err);
      const msg = err.response?.data?.message || "Payment verification failed. Your cart was not cleared.";
      setServerError(msg);
    } finally {
      verificationStartedRef.current = false;
      checkoutInProgressRef.current = false;
      setVerifying(false);
      setSubmitting(false);
    }
  };

  // Step 7, 8, 9, 10: Checkout & Razorpay Submission
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (checkoutInProgressRef.current) return;
    setServerError("");

    if (!validateForm()) {
      return;
    }

    if (!cart || cart.length === 0) {
      setServerError("Your cart is empty. Add products before checking out.");
      return;
    }

    checkoutInProgressRef.current = true;
    setSubmitting(true);
    try {
      const orderData = await createPaymentOrder(formData, checkoutRequestId);

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        setServerError("Razorpay Checkout could not be loaded. Check your connection and try again. Your cart is unchanged.");
        setSubmitting(false);
        checkoutInProgressRef.current = false;
        return;
      }

      // Open Razorpay Standard Checkout
      const options = {
        key: orderData.key,
        amount: Number(orderData.amount),
        currency: orderData.currency || "INR",
        name: "ShopKart",
        description: "Secure Order Checkout",
        order_id: orderData.razorpayOrderId,
        handler: async (response) => {
          await handlePaymentSuccess({
            shopKartOrderId: orderData.shopKartOrderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: formData.fullName,
          email: orderData.customerEmail || user?.email || "",
          contact: `+91${formData.phone.trim()}`,
        },
        notes: {
          shopKartOrderId: String(orderData.shopKartOrderId),
        },
        retry: { enabled: true },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            if (!verificationStartedRef.current) {
              setServerError("Checkout was cancelled. Your cart has not been cleared.");
              setSubmitting(false);
              checkoutInProgressRef.current = false;
            }
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          console.error("Razorpay payment failed:", response.error);
          const description = response.error?.description || "Your payment could not be processed";
          setServerError(`Payment Failed: ${description}. Your cart has not been cleared.`);
          setSubmitting(false);
          checkoutInProgressRef.current = false;
        });
        rzp.open();
      } catch (err) {
        console.error("Razorpay checkout could not be opened:", err);
        setServerError("Razorpay Checkout could not be opened. Please try again. Your cart is unchanged.");
        setSubmitting(false);
        checkoutInProgressRef.current = false;
      }
    } catch (err) {
      console.error("Checkout initiation error:", err);
      const msg = err.response?.data?.message || err.message || "Error processing checkout";
      setServerError(msg);
      setSubmitting(false);
      checkoutInProgressRef.current = false;
    }
  };

  // If cart is empty and no active verification
  if ((!cart || cart.length === 0) && !verifying) {
    return (
      <div className="page-wrapper">
        <div
          style={{
            textAlign: "center",
            padding: "3rem 2rem",
            background: "rgba(17, 24, 39, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            maxWidth: "480px",
            margin: "4rem auto",
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
              margin: "0 auto 1.5rem",
            }}
          >
            <ShoppingBag size={32} color="#818cf8" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            You need to add products to your cart before proceeding to checkout.
          </p>
          <Link
            to="/products"
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              textDecoration: "none",
              padding: "0.8rem 1.8rem",
            }}
          >
            <ArrowLeft size={18} />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ alignItems: "flex-start", padding: "2.5rem 1rem" }}>
      <div className="container" style={{ maxWidth: "1160px", margin: "0 auto", width: "100%" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "1.5rem" }}>
          <Link
            to="/cart"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "color 0.2s",
            }}
          >
            <ArrowLeft size={16} />
            Back to Cart
          </Link>
        </div>

        {/* Page Title & Badges */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-main)", marginBottom: "0.3rem" }}>
              Checkout
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              Complete your delivery address and pay securely with Razorpay.
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "20px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              color: "#818cf8",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <Zap size={15} />
            Razorpay Test Mode
          </div>
        </div>

        {/* Server Error Message */}
        {serverError && (
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "12px",
              color: "#f87171",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          {/* Left Column: Shipping Form */}
          <form id="checkout-form" onSubmit={handleCheckoutSubmit}>
            <CheckoutForm
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              disabled={submitting || verifying}
            />
          </form>

          {/* Right Column: Order Review & Payment CTA */}
          <div
            style={{
              background: "rgba(17, 24, 39, 0.7)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              position: "sticky",
              top: "90px",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Order Summary</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {totalUnits} {totalUnits === 1 ? "unit" : "units"}
              </span>
            </h2>

            {/* Cart Items Review List */}
            <div
              style={{
                maxHeight: "260px",
                overflowY: "auto",
                marginBottom: "1.25rem",
                paddingRight: "0.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              {cart.map((item) => (
                <div
                  key={item.product?._id || item._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "0.85rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "rgba(255, 255, 255, 0.05)",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={getProductImageSource(item.product?.image)}
                        alt={item.product?.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={handleProductImageError}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "var(--text-main)",
                          lineHeight: 1.3,
                          margin: 0,
                        }}
                      >
                        {item.product?.name}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                        Qty: {item.quantity} × ₹{item.product?.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)" }}>
                    ₹{(item.product?.price * item.quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                <span>Shipping / Delivery</span>
                <span style={{ color: "#34d399", fontWeight: 600 }}>FREE</span>
              </div>
              <div
                style={{
                  height: "1px",
                  background: "var(--border-subtle)",
                  margin: "0.5rem 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
                  Total Amount
                </span>
                <span
                  style={{
                    fontSize: "1.45rem",
                    fontWeight: 800,
                    color: "#818cf8",
                  }}
                >
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Pay with Razorpay Button */}
            <button
              id="pay-razorpay-btn"
              type="submit"
              form="checkout-form"
              disabled={submitting || verifying}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "0.9rem 1.5rem",
                fontSize: "1rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                cursor: submitting || verifying ? "not-allowed" : "pointer",
                opacity: submitting || verifying ? 0.75 : 1,
              }}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: "1.2rem", height: "1.2rem", borderWidth: "2px" }} />
                  <span>Creating Razorpay Order...</span>
                </>
              ) : verifying ? (
                <>
                  <div className="spinner" style={{ width: "1.2rem", height: "1.2rem", borderWidth: "2px" }} />
                  <span>Verifying Payment Signature...</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>Pay with Razorpay (₹{subtotal.toLocaleString("en-IN")})</span>
                </>
              )}
            </button>

            <p style={{ margin: "0.85rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Complete your payment in Razorpay Test Mode. No real funds will be deducted.
            </p>

            {/* Trust Badges */}
            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                textAlign: "center",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                <Lock size={13} color="#34d399" />
                <span>256-Bit SSL Secured Payment via Razorpay</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8 }}>
                Test Mode: No real funds will be deducted.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Checkout;
