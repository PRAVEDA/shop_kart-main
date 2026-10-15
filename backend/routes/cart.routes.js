const express = require("express");
const {
    addToCart,
    getCart,
    updateQuantity,
    removeFromCart
} = require("../controllers/cart.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All cart routes are protected
router.use(authMiddleware);

// Add product to cart - POST /cart/:productId
router.post("/:productId", addToCart);

// Get current user's cart - GET /cart
router.get("/", getCart);

// Update product quantity in cart - PATCH /cart/:productId
router.patch("/:productId", updateQuantity);

// Remove product from cart - DELETE /cart/:productId
router.delete("/:productId", removeFromCart);

module.exports = router;
