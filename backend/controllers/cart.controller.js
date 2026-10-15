const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const { inMemoryCarts, fallbackProducts } = require("../utils/inMemoryStore");

// Helper to populate cart.product
const getPopulatedCart = async (userId) => {
    const customer = await Customer.findById(userId).populate({
        path: "cart.product",
        select: "name price image stock category description"
    });
    return (customer?.cart || []).filter((item) => item.product !== null);
};

// ADD PRODUCT TO CART - POST /cart/:productId
const addToCart = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Validate Product ID
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
            let cart = inMemoryCarts.get(userId) || [];
            const existingItem = cart.find(
                (item) => item.product?._id === productId || item.product === productId
            );

            if (existingItem) {
                if (existingItem.quantity + 1 > product.stock) {
                    return res.status(400).json({
                        success: false,
                        message: "Requested quantity exceeds available stock"
                    });
                }
                existingItem.quantity += 1;
            } else {
                if (product.stock < 1) {
                    return res.status(400).json({
                        success: false,
                        message: "Product is out of stock"
                    });
                }
                cart.push({ product, quantity: 1 });
            }
            inMemoryCarts.set(userId, cart);
            return res.status(200).json({
                success: true,
                message: "Cart updated",
                cart
            });
        }

        // 2. Find Product in DB
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

        // 4. Check if product already exists in cart
        if (!customer.cart) customer.cart = [];
        const existingItem = customer.cart.find(
            (item) => item.product.toString() === productId
        );

        if (existingItem) {
            // Check stock limit for increment
            if (existingItem.quantity + 1 > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Requested quantity exceeds available stock"
                });
            }
            existingItem.quantity += 1;
        } else {
            // Check stock for new item
            if (product.stock < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Product is out of stock"
                });
            }
            customer.cart.push({ product: productId, quantity: 1 });
        }

        // 5. Save user
        await customer.save();

        // 6. Return populated updated cart
        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Cart updated",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// GET CURRENT USER'S CART - GET /cart
const getCart = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            const userId = req.user._id.toString();
            const cart = inMemoryCarts.get(userId) || [];
            return res.status(200).json({
                success: true,
                cart
            });
        }

        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// UPDATE PRODUCT QUANTITY - PATCH /cart/:productId
const updateQuantity = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body || {};

        // 1. Validate Product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // 2. Validate Quantity
        const numQty = Number(quantity);
        if (
            quantity === undefined ||
            isNaN(numQty) ||
            !Number.isInteger(numQty) ||
            numQty < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be an integer of at least 1"
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
            let cart = inMemoryCarts.get(userId) || [];
            const cartItem = cart.find(
                (item) => item.product?._id === productId || item.product === productId
            );

            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    message: "Product not in cart"
                });
            }

            if (numQty > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Requested quantity exceeds available stock"
                });
            }

            cartItem.quantity = numQty;
            inMemoryCarts.set(userId, cart);

            return res.status(200).json({
                success: true,
                message: "Cart quantity updated",
                cart
            });
        }

        // 3. Find Product in DB
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // 4. Find authenticated customer
        const customer = await Customer.findById(req.user._id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 5. Find cart item
        const cartItem = (customer.cart || []).find(
            (item) => item.product.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product not in cart"
            });
        }

        // 6. Validate against stock
        if (numQty > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available stock"
            });
        }

        // 7. Update quantity & save
        cartItem.quantity = numQty;
        await customer.save();

        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// REMOVE PRODUCT FROM CART - DELETE /cart/:productId
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        // 1. Validate Product ID
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (mongoose.connection.readyState !== 1) {
            const userId = req.user._id.toString();
            let cart = inMemoryCarts.get(userId) || [];
            const exists = cart.some(
                (item) => item.product?._id === productId || item.product === productId
            );

            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Product not in cart"
                });
            }

            cart = cart.filter(
                (item) => item.product?._id !== productId && item.product !== productId
            );
            inMemoryCarts.set(userId, cart);

            return res.status(200).json({
                success: true,
                message: "Product removed from cart",
                cart
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

        // 3. Check if product is in cart
        const exists = (customer.cart || []).some(
            (item) => item.product.toString() === productId
        );

        if (!exists) {
            return res.status(404).json({
                success: false,
                message: "Product not in cart"
            });
        }

        // 4. Remove item & save
        customer.cart = customer.cart.filter(
            (item) => item.product.toString() !== productId
        );
        await customer.save();

        const cart = await getPopulatedCart(req.user._id);

        return res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateQuantity,
    removeFromCart
};
