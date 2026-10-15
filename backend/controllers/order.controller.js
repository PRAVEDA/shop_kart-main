const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const razorpay = require("../config/razorpay");
const {
  inMemoryOrders,
  inMemoryCarts,
  inMemoryCustomers,
  fallbackProducts,
} = require("../utils/inMemoryStore");

/**
 * Task 4: Create Payment Order
 * POST /orders/create-payment-order
 * Validates shipping address, cart items, stock, calculates server-side total,
 * creates pending ShopKart order and Razorpay order.
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    // Validate shipping address inputs
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
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
        product = fallbackProducts.find((p) => p._id === prodId) || (typeof item.product === "object" ? item.product : null);
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart are no longer available",
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

    const orderId = new mongoose.Types.ObjectId().toString();

    // Create pending ShopKart order
    let shopKartOrder;
    if (mongoose.connection.readyState === 1) {
      try {
        shopKartOrder = new Order({
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
        });
      } catch (e) {
        shopKartOrder = null;
      }
    }

    if (!shopKartOrder) {
      shopKartOrder = {
        _id: orderId,
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
        createdAt: new Date().toISOString(),
      };
      inMemoryOrders.set(orderId, shopKartOrder);
    }

    // Create Razorpay Order in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(serverTotal * 100);
    let razorpayOrderId = null;
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const isPlaceholderKey = !keyId || keyId === "rzp_test_shopkart1234" || keyId.toLowerCase().includes("mock");
    let useSimulator = process.env.NODE_ENV !== "production" && isPlaceholderKey;
    let simulatorFallbackMessage = false;

    if (useSimulator) {
      razorpayOrderId = "order_" + crypto.randomBytes(8).toString("hex");
    } else {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: shopKartOrder._id.toString().slice(0, 40),
          payment_capture: 1,
          notes: {
            shopKartOrderId: shopKartOrder._id.toString(),
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        if (process.env.NODE_ENV !== "production" && keyId.startsWith("rzp_test_")) {
          useSimulator = true;
          simulatorFallbackMessage = true;
          razorpayOrderId = "order_" + crypto.randomBytes(8).toString("hex");
        } else {
          console.error("Razorpay order creation failed:", rzpErr.statusCode || "unknown status");
          return res.status(502).json({
            success: false,
            message: "Razorpay could not create a payment order. Check the merchant credentials and try again.",
          });
        }
      }
    }

    shopKartOrder.razorpayOrderId = razorpayOrderId;
    if (typeof shopKartOrder.save === "function") {
      await shopKartOrder.save();
    } else {
      inMemoryOrders.set(shopKartOrder._id.toString(), shopKartOrder);
    }

    return res.status(201).json({
      success: true,
      message: simulatorFallbackMessage
        ? "Razorpay is unavailable; continue with the test simulator."
        : "Order created successfully. Ready for payment.",
      shopKartOrderId: shopKartOrder._id,
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      key: useSimulator ? "rzp_test_shopkart1234" : keyId,
      paymentMode: useSimulator ? "simulated" : "razorpay",
      allowTestSimulation: process.env.NODE_ENV !== "production" && keyId.startsWith("rzp_test_"),
      customerEmail: customer.email || "",
    });
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
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

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

    // Verify HMAC-SHA256 signature
    // The trusted order id is the razorpayOrderId stored on our server
    const secret = process.env.RAZORPAY_KEY_SECRET || "shopkart_test_secret_1234";
    const body = order.razorpayOrderId + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = "FAILED";
      if (typeof order.save === "function") {
        await order.save();
      } else {
        inMemoryOrders.set(order._id.toString(), order);
      }
      // DO NOT clear cart on failed signature!
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature. Verification failed.",
      });
    }

    // Signature verified! Confirm order
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    if (typeof order.save === "function") {
      await order.save();

      // Decrement stock for ordered items
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      // Clear user's cart in database
      const customer = await Customer.findById(req.user._id);
      if (customer) {
        customer.cart = [];
        await customer.save();
      }
    } else {
      // In-memory update
      inMemoryOrders.set(order._id.toString(), order);
      inMemoryCarts.set(req.user._id.toString(), []);
      for (const item of order.items) {
        const prod = fallbackProducts.find((p) => p._id === item.product.toString());
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
        }
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

/**
 * Development / Test Helper: Generate Test Signature
 * POST /orders/test-signature
 * Allows testing HMAC verification without exposing secret to client.
 */
exports.generateTestSignature = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const { razorpayOrderId, razorpayPaymentId } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "razorpayOrderId and razorpayPaymentId are required",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "shopkart_test_secret_1234";
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    return res.status(200).json({
      success: true,
      signature,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error generating test signature",
      error: error.message,
    });
  }
};
