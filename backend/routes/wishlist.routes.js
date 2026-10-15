const express = require("express");
const {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    toggleWishlist
} = require("../controllers/wishlist.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// All wishlist routes are protected
router.use(authMiddleware);

// Add product to wishlist - POST /wishlist/:productId
router.post("/:productId", addToWishlist);

// Get current user's wishlist - GET /wishlist
router.get("/", getWishlist);

// Remove product from wishlist - DELETE /wishlist/:productId
router.delete("/:productId", removeFromWishlist);

// Bonus: Toggle wishlist item - PATCH /wishlist/:productId/toggle
router.patch("/:productId/toggle", toggleWishlist);
router.post("/:productId/toggle", toggleWishlist);

module.exports = router;
