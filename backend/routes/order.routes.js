const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// All order endpoints are protected by JWT authentication
router.post("/create-payment-order", authMiddleware, orderController.createPaymentOrder);
router.post("/verify-payment", authMiddleware, orderController.verifyPayment);
router.get("/", authMiddleware, orderController.getMyOrders);
router.get("/:id", authMiddleware, orderController.getOrderById);
router.patch("/:id/status", authMiddleware, orderController.updateOrderStatus);

module.exports = router;
