const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const { inMemoryWishlists, fallbackProducts } = require("../utils/inMemoryStore");

// ADD PRODUCT TO WISHLIST - POST /wishlist/:productId
const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Validate productId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (mongoose.connection.readyState !== 1) {
            const product = fallbackProducts.find((p) => p._id === productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
            const userId = req.user._id.toString();
            let wishlist = inMemoryWishlists.get(userId) || [];
            if (wishlist.some((p) => p._id === productId)) {
                return res.status(409).json({
                    success: false,
                    message: "Product already in wishlist"
                });
            }
            wishlist.push(product);
            inMemoryWishlists.set(userId, wishlist);
            return res.status(201).json({
                success: true,
                message: "Product added to wishlist"
            });
        }

        // 2. Find product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // 3. Find authenticated customer
        const customer = await Customer.findById(req.user._id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 4. Check if already in wishlist (Duplicate prevention)
        const isAlreadyWishlisted = customer.wishlist && customer.wishlist.some(
            (id) => id.toString() === productId
        );

        if (isAlreadyWishlisted) {
            return res.status(409).json({
                success: false,
                message: "Product already in wishlist"
            });
        }

        // 5. Add Product reference & save
        customer.wishlist.push(productId);
        await customer.save();

        return res.status(201).json({
            success: true,
            message: "Product added to wishlist"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// GET CURRENT USER'S WISHLIST - GET /wishlist
const getWishlist = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const userId = req.user._id.toString();
            const wishlist = inMemoryWishlists.get(userId) || [];
            return res.status(200).json({
                success: true,
                count: wishlist.length,
                wishlist
            });
        }

        // Authenticated user from auth middleware
        const customer = await Customer.findById(req.user._id).populate({
            path: "wishlist",
            select: "name price category image stock description"
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Filter out null references if a product was deleted
        const activeItems = (customer.wishlist || []).filter((item) => item !== null);

        return res.status(200).json({
            success: true,
            count: activeItems.length,
            wishlist: activeItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// REMOVE PRODUCT FROM WISHLIST - DELETE /wishlist/:productId
const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Validate productId
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (mongoose.connection.readyState !== 1) {
            const userId = req.user._id.toString();
            let wishlist = inMemoryWishlists.get(userId) || [];
            const exists = wishlist.some((p) => p._id === productId);
            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Product not in wishlist"
                });
            }
            wishlist = wishlist.filter((p) => p._id !== productId);
            inMemoryWishlists.set(userId, wishlist);
            return res.status(200).json({
                success: true,
                message: "Product removed from wishlist"
            });
        }

        // 2. Find authenticated customer
        const customer = await Customer.findById(req.user._id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 3. Check if product is in wishlist
        const isWishlisted = customer.wishlist && customer.wishlist.some(
            (id) => id.toString() === productId
        );

        if (!isWishlisted) {
            return res.status(404).json({
                success: false,
                message: "Product not in wishlist"
            });
        }

        // 4. Remove reference & save
        customer.wishlist = customer.wishlist.filter(
            (id) => id.toString() !== productId
        );
        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from wishlist"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// BONUS CHALLENGE (+10 Marks): TOGGLE WISHLIST - PATCH /wishlist/:productId/toggle
const toggleWishlist = async (req, res) => {
    try {
        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (mongoose.connection.readyState !== 1) {
            const product = fallbackProducts.find((p) => p._id === productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
            const userId = req.user._id.toString();
            let wishlist = inMemoryWishlists.get(userId) || [];
            const isAlreadyWishlisted = wishlist.some((p) => p._id === productId);

            if (isAlreadyWishlisted) {
                wishlist = wishlist.filter((p) => p._id !== productId);
                inMemoryWishlists.set(userId, wishlist);
                return res.status(200).json({
                    success: true,
                    saved: false,
                    message: "Product removed from wishlist"
                });
            } else {
                wishlist.push(product);
                inMemoryWishlists.set(userId, wishlist);
                return res.status(200).json({
                    success: true,
                    saved: true,
                    message: "Product added to wishlist"
                });
            }
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const customer = await Customer.findById(req.user._id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isAlreadyWishlisted = customer.wishlist && customer.wishlist.some(
            (id) => id.toString() === productId
        );

        if (isAlreadyWishlisted) {
            customer.wishlist = customer.wishlist.filter(
                (id) => id.toString() !== productId
            );
            await customer.save();
            return res.status(200).json({
                success: true,
                saved: false,
                message: "Product removed from wishlist"
            });
        } else {
            customer.wishlist.push(productId);
            await customer.save();
            return res.status(200).json({
                success: true,
                saved: true,
                message: "Product added to wishlist"
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    toggleWishlist
};
