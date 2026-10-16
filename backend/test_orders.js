const fs = require("fs");
const path = require("path");
const backendEnvPath = path.resolve(__dirname, ".env");
const rootEnvPath = path.resolve(__dirname, "../.env");
require("dotenv").config({ path: fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath });
const crypto = require("crypto");
const assert = require("assert");
const verifyRazorpaySignature = require("./utils/verifyRazorpaySignature");

async function runOrderTests() {
  const baseURL = process.env.TEST_API_URL || "http://localhost:5000";
  console.log("=== SHOPKART RAZORPAY INTEGRATION CHECKS ===\n");

  const signatureOrderId = "order_signature_test";
  const signaturePaymentId = "pay_signature_test";
  const signatureSecret = "unit-test-secret";
  const validTestSignature = crypto
    .createHmac("sha256", signatureSecret)
    .update(`${signatureOrderId}|${signaturePaymentId}`)
    .digest("hex");
  assert.strictEqual(verifyRazorpaySignature({
    orderId: signatureOrderId,
    paymentId: signaturePaymentId,
    signature: validTestSignature,
    secret: signatureSecret,
  }), true);
  assert.strictEqual(verifyRazorpaySignature({
    orderId: signatureOrderId,
    paymentId: signaturePaymentId,
    signature: `${validTestSignature.slice(0, -1)}0`,
    secret: signatureSecret,
  }), false);
  assert.strictEqual(verifyRazorpaySignature({
    orderId: signatureOrderId,
    paymentId: signaturePaymentId,
    signature: "not-a-signature",
    secret: signatureSecret,
  }), false);
  console.log("Signature helper accepts a valid HMAC and rejects altered/malformed signatures.");

  // Helper for requests with cookies
  let cookies = "";
  async function request(path, options = {}) {
    const headers = options.headers || {};
    if (cookies) headers["Cookie"] = cookies;
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

    const res = await fetch(`${baseURL}${path}`, {
      ...options,
      headers,
    });

    // Capture set-cookie
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      cookies = setCookie.split(";")[0];
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status: res.status, data };
  }

  // Create a fresh test user.
  const email = `order_tester_${Date.now()}@example.com`;
  const regRes = await request("/customers/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Order Test User",
      email,
      phone: "9876543210",
      password: "Password@123",
      confirmPassword: "Password@123",
    }),
  });
  assert.strictEqual(regRes.status, 201, "Registration should succeed");

  // Log in to get authentication cookie
  const loginRes = await request("/customers/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password@123",
    }),
  });
  assert.strictEqual(loginRes.status, 200, "Login should succeed");
  assert.ok(cookies, "Login should set the auth cookie");

  // Empty cart must be rejected before an order is created.
  const emptyRes = await request("/orders/create-payment-order", {
    method: "POST",
    body: JSON.stringify({
      shippingAddress: {
        fullName: "Order Test User",
        phone: "9876543210",
        addressLine1: "123 Tech Park",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      idempotencyKey: crypto.randomUUID(),
    }),
  });
  assert.strictEqual(emptyRes.status, 400, "Empty cart should be rejected");

  // Protected order creation must reject unauthenticated requests.
  const unauthRes = await fetch(`${baseURL}/orders/create-payment-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shippingAddress: {
        fullName: "Ghost User",
        phone: "9876543210",
        addressLine1: "123 Tech Park",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
    }),
  });
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated order creation should be rejected");

  // Get a product to add to cart
  const prodRes = await request("/products");
  const products = prodRes.data?.products || [];
  if (products.length === 0) throw new Error("No products available to test orders");
  const testProduct = products[0];
  console.log(`Using product: ${testProduct.name} (Price: ₹${testProduct.price}, Stock: ${testProduct.stock})`);

  // Add one item to the authenticated cart.
  await request(`/cart/${testProduct._id}`, { method: "POST" });

  const idempotencyKey = crypto.randomUUID();
  const shippingAddress = {
    fullName: "Order Test User",
    phone: "9876543210",
    addressLine1: "123 Tech Park",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  };

  // Missing credentials must fail closed and never create a fake payment order.
  const hasTestCredentials = Boolean(
    (process.env.RAZORPAY_MODE || "test").toLowerCase() === "test" &&
    process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes("replace") &&
    !process.env.RAZORPAY_KEY_SECRET.includes("replace")
  );

  const createOrderRes = await request("/orders/create-payment-order", {
    method: "POST",
    body: JSON.stringify({
      shippingAddress,
      idempotencyKey,
      totalAmount: 1,
    }),
  });
  const cartBeforeRes = await request("/cart");
  assert.strictEqual(cartBeforeRes.data?.cart?.length, 1, "Cart must remain intact before payment");

  if (!hasTestCredentials) {
    assert.strictEqual(createOrderRes.status, 503, "Missing Razorpay credentials should fail closed");
    assert.match(createOrderRes.data?.message || "", /RAZORPAY_KEY_ID/);
    assert.ok(!createOrderRes.data?.razorpayOrderId, "No fake Razorpay order ID should be returned");
    console.log("No real test keys configured: checkout correctly fails closed; no simulated payment order was created.");
    return;
  }

  assert.strictEqual(createOrderRes.status, 201, "Razorpay order should be created");
  const { shopKartOrderId, razorpayOrderId, amount } = createOrderRes.data;
  assert.ok(razorpayOrderId?.startsWith("order_"), "Razorpay must return the order ID");
  assert.strictEqual(amount, Math.round(testProduct.price * 100), "Order amount must use the server-side product price");

  const duplicateRes = await request("/orders/create-payment-order", {
    method: "POST",
    body: JSON.stringify({ shippingAddress, idempotencyKey, totalAmount: 1 }),
  });
  assert.strictEqual(duplicateRes.status, 200, "Repeated checkout request should reuse its order");
  assert.strictEqual(duplicateRes.data?.shopKartOrderId, shopKartOrderId);
  assert.strictEqual(duplicateRes.data?.razorpayOrderId, razorpayOrderId);

  const invalidSignatureRes = await request("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify({
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: "pay_invalid_test",
      razorpay_signature: "invalid_signature",
    }),
  });
  assert.strictEqual(invalidSignatureRes.status, 400, "Invalid signature must be rejected");

  const cartAfterFailure = await request("/cart");
  assert.strictEqual(cartAfterFailure.data?.cart?.length, 1, "Invalid payment must not clear the cart");
  const ordersRes = await request("/orders");
  const pendingOrder = ordersRes.data?.orders?.find((order) => order._id === shopKartOrderId);
  assert.strictEqual(pendingOrder?.paymentStatus, "PENDING", "Invalid signature must not mutate payment status");

  console.log("Real Razorpay order, idempotent retry, and invalid-signature/cart-preservation checks passed.");
}

runOrderTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
