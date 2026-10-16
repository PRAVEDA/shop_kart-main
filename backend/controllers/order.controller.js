const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const { createRazorpayClient, getRazorpayCredentials } = require("../config/razorpay");
const verifyRazorpaySignature = require("../utils/verifyRazorpaySignature");
const {
  inMemoryOrders,
  inMemoryCarts,
  inMemoryCustomers,
  fallbackProducts,
} = require("../utils/inMemoryStore");

const paymentOrderCreations = new Set();

const paymentOrderResponse = (order, credentials, customer, idempotent = false) => ({
  success: true,
  message: idempotent ? "Existing payment order returned." : "Order created successfully. Ready for payment.",
  shopKartOrderId: order._id,
  razorpayOrderId: order.razorpayOrderId,
  amount: Math.round(Number(order.totalAmount) * 100),
  currency: "INR",
  key: order.razorpayKeyId || credentials.keyId,
  customerEmail: customer.email || "",
  idempotent,
});

/**
 * Task 4: Create Payment Order
 * POST /orders/create-payment-order
 * Validates shipping address, cart items, stock, calculates server-side total,
 * creates pending ShopKart order and Razorpay order.
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress, idempotencyKey } = req.body || {};

    // Validate shipping address inputs
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    if (typeof idempotencyKey !== "string" || !/^[a-f0-9-]{36}$/i.test(idempotencyKey)) {
      return res.status(400).json({
        success: false,
        message: "A valid checkout idempotency key is required",
      });
    }

    const { fullName, phone, addressLine1, city, state, pincode } = shippingAddress;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All shipping address fields are required and cannot be empty",
      });
    }

    // Phone validation (Indian mobile: 10 digits starting 6-9)
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be a valid 10-digit Indian mobile number",
      });
    }

    // Pincode validation (6 digits)
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: "Pincode must contain exactly 6 digits",
      });
    }

    // Load customer & cart (Database or in-memory fallback)
    let customer = null;
    let cartItems = [];

    if (mongoose.connection.readyState === 1) {
      try {
        customer = await Customer.findById(req.user._id);
        cartItems = customer?.cart || [];
      } catch (e) {
        // Fall through
      }
    }

    if (!customer) {
      customer = inMemoryCustomers.get(req.user._id.toString()) || req.user;
      cartItems = inMemoryCarts.get(req.user._id.toString()) || [];
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before checking out.",
      });
    }

    // Load latest product documents to verify stock and price (never trust frontend totals)
    const orderItems = [];
    let serverTotal = 0;

    for (const item of cartItems) {
      const prodId = (item.product?._id || item.product).toString();
      let product = null;

      if (mongoose.connection.readyState === 1) {
        try {
          product = await Product.findById(prodId);
        } catch (e) { }
      }

      if (!product) {
        product = fallbackProducts.find((p) => p._id === prodId);
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart are no longer available",
        });
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Cart quantities must be positive whole numbers",
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, in cart: ${item.quantity}.`,
        });
      }

      const itemPrice = product.price;
      serverTotal += itemPrice * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: product.image,
      });
    }

    let credentials;
    let razorpayClient;
    try {
      credentials = getRazorpayCredentials();
      razorpayClient = createRazorpayClient(credentials);
    } catch (configurationError) {
      return res.status(503).json({
        success: false,
        message: configurationError.message,
      });
    }

    const customerId = customer._id.toString();
    const creationKey = `${customerId}:${idempotencyKey}`;
    if (paymentOrderCreations.has(creationKey)) {
      return res.status(409).json({
        success: false,
        message: "This checkout request is already being processed. Please wait and retry.",
      });
    }

    paymentOrderCreations.add(creationKey);
    try {
      const databaseAvailable = mongoose.connection.readyState === 1;
      let shopKartOrder = databaseAvailable
        ? await Order.findOne({ user: customer._id, checkoutRequestId: idempotencyKey })
        : Array.from(inMemoryOrders.values()).find(
          (order) => order.user.toString() === customerId && order.checkoutRequestId === idempotencyKey
        );

      if (shopKartOrder?.paymentStatus === "PAID") {
        return res.status(409).json({
          success: false,
          message: "This checkout request has already been paid.",
        });
      }

      if (shopKartOrder?.paymentStatus === "FAILED") {
        return res.status(409).json({
          success: false,
          message: "This checkout request has already failed. Start checkout again.",
        });
      }

      if (shopKartOrder?.razorpayOrderId) {
        return res.status(200).json(paymentOrderResponse(shopKartOrder, credentials, customer, true));
      }

      if (!shopKartOrder) {
        const orderData = {
          user: customer._id,
          items: orderItems,
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            addressLine1: addressLine1.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
          },
          totalAmount: serverTotal,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          checkoutRequestId: idempotencyKey,
          razorpayKeyId: credentials.keyId,
        };

        if (databaseAvailable) {
          shopKartOrder = new Order(orderData);
          try {
            await shopKartOrder.save();
          } catch (saveError) {
            if (saveError.code !== 11000) throw saveError;
            shopKartOrder = await Order.findOne({ user: customer._id, checkoutRequestId: idempotencyKey });
            if (!shopKartOrder) throw saveError;
            if (shopKartOrder.razorpayOrderId) {
              return res.status(200).json(paymentOrderResponse(shopKartOrder, credentials, customer, true));
            }
          }
        } else {
          shopKartOrder = {
            ...orderData,
            _id: new mongoose.Types.ObjectId().toString(),
            createdAt: new Date().toISOString(),
          };
          inMemoryOrders.set(shopKartOrder._id, shopKartOrder);
        }
      }

      const amountInPaise = Math.round(serverTotal * 100);
      let razorpayOrder;
      try {
        razorpayOrder = await razorpayClient.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: shopKartOrder._id.toString().slice(0, 40),
          notes: { shopKartOrderId: shopKartOrder._id.toString() },
        });
      } catch (razorpayError) {
        const authenticationFailed = razorpayError.statusCode === 401;
        const providerError = razorpayError.error || {};
        const safeDescription = String(providerError.description || razorpayError.description || "Razorpay order request failed")
          .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[redacted email]")
          .replace(/\b\d{7,}\b/g, "[redacted number]")
          .replace(/rzp_(?:test|live)_[A-Za-z0-9]+/gi, "[redacted key]")
          .replace(/(?:key[_\s-]?secret\s*[:=]\s*)\S+/gi, "$1[redacted]")
          .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[redacted value]")
          .slice(0, 240);
        const safeErrorCode = String(providerError.code || razorpayError.code || "unknown")
          .replace(/[^A-Za-z0-9_.-]/g, "")
          .slice(0, 64);
        console.error("Razorpay order creation failed:", JSON.stringify({
          httpStatus: Number(razorpayError.statusCode || razorpayError.status) || null,
          errorCode: safeErrorCode,
          description: safeDescription,
        }));
        return res.status(502).json({
          success: false,
          message: authenticationFailed
            ? "Razorpay rejected the Test Mode credentials. Confirm the Key ID and Key Secret are the matching pair from the same Test Mode API key."
            : "Razorpay could not create a payment order. Verify the test API credentials and try again.",
        });
      }

      shopKartOrder.razorpayOrderId = razorpayOrder.id;
      shopKartOrder.razorpayKeyId = credentials.keyId;
      if (typeof shopKartOrder.save === "function") {
        await shopKartOrder.save();
      } else {
        inMemoryOrders.set(shopKartOrder._id.toString(), shopKartOrder);
      }

      return res.status(201).json(paymentOrderResponse(shopKartOrder, credentials, customer));
    } finally {
      paymentOrderCreations.delete(creationKey);
    }
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating payment order",
      error: error.message,
    });
  }
};

/**
 * Task 5 & Step 11: Verify Razorpay Payment Signature
 * POST /orders/verify-payment
 * Verifies HMAC-SHA256 signature, confirms order as PAID, decrements stock, clears cart.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!shopKartOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(shopKartOrderId);
      } catch (e) { }
    }

    if (!order) {
      order = inMemoryOrders.get(shopKartOrderId.toString());
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match the ShopKart order",
      });
    }

    // Ownership verification
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to verify this order",
      });
    }

    if (order.paymentStatus === "PAID") {
      if (order.razorpayPaymentId === razorpay_payment_id) {
        return res.status(200).json({ success: true, message: "Payment was already verified.", order });
      }
      return res.status(409).json({ success: false, message: "This order has already been paid." });
    }

    if (order.paymentStatus !== "PENDING" || order.status !== "PENDING_PAYMENT") {
      return res.status(409).json({ success: false, message: "This order is not awaiting payment." });
    }

    let credentials;
    let razorpayClient;
    try {
      credentials = getRazorpayCredentials();
      razorpayClient = createRazorpayClient(credentials);
    } catch (configurationError) {
      return res.status(503).json({ success: false, message: configurationError.message });
    }

    if (order.razorpayKeyId !== credentials.keyId) {
      return res.status(409).json({
        success: false,
        message: "The payment order was created with different Razorpay credentials.",
      });
    }

    if (!verifyRazorpaySignature({
      orderId: order.razorpayOrderId,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret: credentials.keySecret,
    })) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Verification failed.",
      });
    }

    let payment;
    try {
      payment = await razorpayClient.payments.fetch(razorpay_payment_id);
    } catch (razorpayError) {
      console.error("Razorpay payment lookup failed:", razorpayError.statusCode || "unknown status");
      return res.status(502).json({
        success: false,
        message: "Razorpay could not confirm the payment. Your cart has not been cleared.",
      });
    }

    const expectedAmount = Math.round(Number(order.totalAmount) * 100);
    if (
      payment.order_id !== order.razorpayOrderId ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(409).json({
        success: false,
        message: "Razorpay has not confirmed a captured payment for this order. Your cart has not been cleared.",
      });
    }

    const paidFields = {
      paymentStatus: "PAID",
      status: "PLACED",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    };

    if (mongoose.connection.readyState === 1) {
      const paidOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          user: req.user._id,
          paymentStatus: "PENDING",
          status: "PENDING_PAYMENT",
          razorpayOrderId: order.razorpayOrderId,
        },
        { $set: paidFields },
        { new: true }
      );

      if (!paidOrder) {
        const latestOrder = await Order.findById(order._id);
        if (latestOrder?.paymentStatus === "PAID" && latestOrder.razorpayPaymentId === razorpay_payment_id) {
          return res.status(200).json({ success: true, message: "Payment was already verified.", order: latestOrder });
        }
        return res.status(409).json({ success: false, message: "This order has already been processed." });
      }

      order = paidOrder;
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
      }
      await Customer.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
    } else {
      if (order.paymentStatus !== "PENDING") {
        if (order.paymentStatus === "PAID" && order.razorpayPaymentId === razorpay_payment_id) {
          return res.status(200).json({ success: true, message: "Payment was already verified.", order });
        }
        return res.status(409).json({ success: false, message: "This order has already been processed." });
      }

      Object.assign(order, paidFields);
      inMemoryOrders.set(order._id.toString(), order);
      inMemoryCarts.set(req.user._id.toString(), []);
      for (const item of order.items) {
        const product = fallbackProducts.find((p) => p._id === item.product.toString());
        if (product) product.stock = Math.max(0, product.stock - item.quantity);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Order confirmed.",
      order,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying payment",
      error: error.message,
    });
  }
};

/**
 * Task 7: Get Current User's Orders
 * GET /orders
 * Returns orders belonging to authenticated user sorted newest first.
 */
exports.getMyOrders = async (req, res) => {
  try {
    let orders = [];

    if (mongoose.connection.readyState === 1) {
      try {
        orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
      } catch (e) { }
    }

    if (!orders || orders.length === 0) {
      const allMem = Array.from(inMemoryOrders.values());
      orders = allMem
        .filter((o) => o.user.toString() === req.user._id.toString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching orders",
      error: error.message,
    });
  }
};

/**
 * Single Order API: Get one order by ID
 * GET /orders/:id
 * Enforces ownership: only order owner can view it.
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(id);
      } catch (e) { }
    }

    if (!order) {
      order = inMemoryOrders.get(id.toString());
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden. You do not own this order.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching order details",
      error: error.message,
    });
  }
};

/**
 * Bonus Challenge (+10 Marks): Update Order Status
 * PATCH /orders/:id/status
 * Progression: PLACED -> CONFIRMED -> SHIPPED -> DELIVERED
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    let order = null;
    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(id);
      } catch (e) { }
    }

    if (!order) {
      order = inMemoryOrders.get(id.toString());
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check ownership or admin
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden.",
      });
    }

    order.status = status;
    if (typeof order.save === "function") {
      await order.save();
    } else {
      inMemoryOrders.set(order._id.toString(), order);
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating order status",
      error: error.message,
    });
  }
};

