require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const crypto = require("crypto");

async function runOrderTests() {
  const baseURL = "http://localhost:5000";
  console.log("=== STARTING SHOPKART LAB 06 ORDER & PAYMENT TESTS ===\n");

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

  // 1. Create a fresh test user
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
  console.log("Registered test user:", email, "Status:", regRes.status);

  // Log in to get authentication cookie
  const loginRes = await request("/customers/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Password@123",
    }),
  });
  console.log("Logged in test user. Status:", loginRes.status, "Cookie captured:", !!cookies);

  // Test 1: Empty cart rejection
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
    }),
  });
  console.log("Test 1 (Empty cart): Status", emptyRes.status, "Message:", emptyRes.data?.message);
  if (emptyRes.status !== 400) throw new Error("Expected 400 for empty cart");

  // Test 2: Unauthenticated request
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
  console.log("Test 2 (Unauthenticated): Status", unauthRes.status);
  if (unauthRes.status !== 401) throw new Error("Expected 401 for unauthenticated request");

  // Get a product to add to cart
  const prodRes = await request("/products");
  const products = prodRes.data?.products || [];
  if (products.length === 0) throw new Error("No products available to test orders");
  const testProduct = products[0];
  console.log(`Using product: ${testProduct.name} (Price: ₹${testProduct.price}, Stock: ${testProduct.stock})`);

  // Add 2 units of testProduct to cart
  await request(`/cart/${testProduct._id}`, { method: "POST" });
  await request(`/cart/${testProduct._id}`, { method: "POST" });

  // Test 3: Create Payment Order with fake total sent from frontend (should be ignored)
  const createOrderRes = await request("/orders/create-payment-order", {
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
      totalAmount: 1, // Fake total from client, must be ignored!
    }),
  });
  console.log("Test 3 (Create Payment Order): Status", createOrderRes.status, createOrderRes.data?.message);
  if (createOrderRes.status !== 201) throw new Error("Expected 201 on order creation");

  const { shopKartOrderId, razorpayOrderId, amount } = createOrderRes.data;
  const expectedAmountInPaise = Math.round(testProduct.price * 2 * 100);
  console.log(`Razorpay order ID: ${razorpayOrderId}, Amount in paise: ${amount} (Expected: ${expectedAmountInPaise})`);
  if (amount !== expectedAmountInPaise) {
    throw new Error(`Server did not calculate correct total. Expected ${expectedAmountInPaise}, got ${amount}`);
  }

  // Test 4: Verify cart still contains items before payment confirmation
  const cartBeforeRes = await request("/cart");
  console.log("Test 4 (Cart before payment): Items in cart =", cartBeforeRes.data?.cart?.length);
  if (cartBeforeRes.data?.cart?.length !== 1) throw new Error("Cart should still have items before payment!");

  // Test 5: Verify payment with FAKE signature (must be rejected, order marked FAILED, cart NOT cleared)
  const fakeSigRes = await request("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify({
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: "pay_fake123",
      razorpay_signature: "invalid_fake_signature_hex",
    }),
  });
  console.log("Test 5 (Fake signature verification): Status", fakeSigRes.status, "Message:", fakeSigRes.data?.message);
  if (fakeSigRes.status !== 400) throw new Error("Expected 400 for fake signature");

  // Verify cart STILL contains items after failed payment
  const cartAfterFail = await request("/cart");
  if (cartAfterFail.data?.cart?.length !== 1) throw new Error("Cart should NOT be cleared after failed payment!");

  // Test 6: Verify payment with VALID HMAC SHA-256 signature
  const testSecret = process.env.RAZORPAY_KEY_SECRET || "shopkart_test_secret_1234";
  const testPaymentId = "pay_test_" + Date.now();
  const validSignature = crypto
    .createHmac("sha256", testSecret)
    .update(`${razorpayOrderId}|${testPaymentId}`)
    .digest("hex");

  const validSigRes = await request("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify({
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: validSignature,
    }),
  });
  console.log("Test 6 (Valid signature verification): Status", validSigRes.status, "Message:", validSigRes.data?.message);
  if (validSigRes.status !== 200) throw new Error("Expected 200 for valid payment verification");

  const confirmedOrder = validSigRes.data?.order;
  if (confirmedOrder?.paymentStatus !== "PAID" || confirmedOrder?.status !== "PLACED") {
    throw new Error(`Order state incorrect. paymentStatus: ${confirmedOrder?.paymentStatus}, status: ${confirmedOrder?.status}`);
  }

  // Test 7: Verify cart is now CLEARED in database
  const cartAfterSuccess = await request("/cart");
  console.log("Test 7 (Cart after verified payment): Items in cart =", cartAfterSuccess.data?.cart?.length);
  if (cartAfterSuccess.data?.cart?.length !== 0) throw new Error("Cart should be empty after verified payment!");

  // Test 8: Get My Orders
  const ordersRes = await request("/orders");
  console.log("Test 8 (Get My Orders): Status", ordersRes.status, "Count:", ordersRes.data?.count);
  if (ordersRes.data?.orders?.length === 0) throw new Error("Expected order to appear in My Orders");

  // Test 9: Get Single Order by ID
  const singleOrderRes = await request(`/orders/${shopKartOrderId}`);
  console.log("Test 9 (Get Order By ID): Status", singleOrderRes.status, "Order ID:", singleOrderRes.data?.order?._id);
  if (singleOrderRes.status !== 200) throw new Error("Expected 200 on get single order");

  // Test 10: Bonus - Update Order Status
  const statusUpdateRes = await request(`/orders/${shopKartOrderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "CONFIRMED" }),
  });
  console.log("Test 10 (Bonus - Status update): Status", statusUpdateRes.status, "New Status:", statusUpdateRes.data?.order?.status);
  if (statusUpdateRes.data?.order?.status !== "CONFIRMED") throw new Error("Status update failed");

  console.log("\n🎉 ALL 10 ORDER & PAYMENT BACKEND TESTS PASSED SUCCESSFULLY! 🎉");
}

runOrderTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
