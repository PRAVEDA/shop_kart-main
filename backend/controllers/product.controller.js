const mongoose = require("mongoose");
const Product = require("../models/product.model");

// CREATE PRODUCT - POST /products
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, image, stock } = req.body || {};

        // Validation: Check required fields
        if (
            name === undefined ||
            description === undefined ||
            price === undefined ||
            category === undefined ||
            image === undefined ||
            stock === undefined ||
            !String(name).trim() ||
            !String(description).trim() ||
            !String(category).trim() ||
            !String(image).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing required field: name, description, price, category, image, and stock are required"
            });
        }

        // Validation: Price must be a number > 0
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid price: Price must be a number greater than 0"
            });
        }

        // Validation: Stock must be a non-negative number (>= 0)
        const numericStock = Number(stock);
        if (isNaN(numericStock) || numericStock < 0 || !Number.isInteger(numericStock)) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock: Stock must be a non-negative integer"
            });
        }

        // Create in MongoDB
        const product = await Product.create({
            name: String(name).trim(),
            description: String(description).trim(),
            price: numericPrice,
            category: String(category).trim(),
            image: String(image).trim(),
            stock: numericStock
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Seed/Fallback products used when MongoDB is offline or initial connection is pending
const fallbackProducts = [
    {
        _id: "65f000000000000000000001",
        name: "Mechanical Keyboard",
        description: "Custom RGB mechanical keyboard with tactile blue switches, double-shot PBT keycaps, and aircraft-grade aluminum frame.",
        price: 2999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
        stock: 15,
        createdAt: new Date("2026-01-01").toISOString()
    },
    {
        _id: "65f000000000000000000002",
        name: "Noise Cancelling Headphones",
        description: "Wireless over-ear headphones with active hybrid noise cancellation, 40-hour battery life, and crystal-clear studio acoustics.",
        price: 4999,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        stock: 25,
        createdAt: new Date("2026-01-02").toISOString()
    },
    {
        _id: "65f000000000000000000003",
        name: "Ultra HD Smart Watch",
        description: "Sleek fitness and lifestyle smartwatch featuring AMOLED always-on display, heart-rate tracking, GPS, and water resistance up to 50m.",
        price: 3499,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        stock: 8,
        createdAt: new Date("2026-01-03").toISOString()
    },
    {
        _id: "65f000000000000000000004",
        name: "Wireless Ergonomic Mouse",
        description: "Precision wireless mouse designed for all-day comfort with silent magnetic switches, thumb rest, and rechargeable battery.",
        price: 1299,
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
        stock: 30,
        createdAt: new Date("2026-01-04").toISOString()
    },
    {
        _id: "65f000000000000000000005",
        name: "Classic Denim Jacket",
        description: "Timeless vintage wash denim jacket made from 100% sustainable organic cotton with rugged metal button closures.",
        price: 2499,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
        stock: 12,
        createdAt: new Date("2026-01-05").toISOString()
    },
    {
        _id: "65f000000000000000000006",
        name: "Minimalist Canvas Backpack",
        description: "Durable water-resistant canvas travel backpack with padded laptop sleeve, anti-theft hidden pocket, and ergonomic shoulder straps.",
        price: 1899,
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        stock: 18,
        createdAt: new Date("2026-01-06").toISOString()
    },
    {
        _id: "65f000000000000000000007",
        name: "Clean Code Handbook",
        description: "The definitive guide to software craftsmanship by Robert C. Martin, covering best engineering practices, refactoring, and code hygiene.",
        price: 899,
        category: "Books",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        stock: 40,
        createdAt: new Date("2026-01-07").toISOString()
    },
    {
        _id: "65f000000000000000000008",
        name: "Atomic Habits Hardcover",
        description: "An easy and proven way to build good habits and break bad ones by James Clear. Global bestseller with actionable transformation frameworks.",
        price: 599,
        category: "Books",
        image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
        stock: 50,
        createdAt: new Date("2026-01-08").toISOString()
    },
    {
        _id: "65f000000000000000000009",
        name: "Modern Ceramic Desk Lamp",
        description: "Contemporary Nordic style ceramic table lamp with touch-dimmable warm ambient LED light and matte stone finish.",
        price: 1499,
        category: "Home",
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
        stock: 14,
        createdAt: new Date("2026-01-09").toISOString()
    },
    {
        _id: "65f000000000000000000010",
        name: "Aroma Ultrasonic Diffuser",
        description: "Quiet ultrasonic essential oil diffuser with 7-color ambient night light, auto-shutoff timer, and wood-grain aesthetic design.",
        price: 1199,
        category: "Home",
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
        stock: 22,
        createdAt: new Date("2026-01-10").toISOString()
    }
];

const getFallbackFiltered = (search, category, sort) => {
    let list = [...fallbackProducts];

    if (search && String(search).trim()) {
        const s = String(search).trim().toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }

    if (category && String(category).trim() && String(category).trim().toLowerCase() !== "all" && String(category).trim().toLowerCase() !== "all categories") {
        const c = String(category).trim().toLowerCase();
        list = list.filter(p => p.category.toLowerCase() === c);
    }

    if (sort === "price_asc") {
        list.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
        list.sort((a, b) => b.price - a.price);
    } else {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
};

// GET ALL PRODUCTS (with search, category filter, and bonus price sorting) - GET /products
const getAllProducts = async (req, res) => {
    const { search, category, sort } = req.query;

    // If MongoDB is not connected, serve cached sample catalog immediately
    if (mongoose.connection.readyState !== 1) {
        const products = getFallbackFiltered(search, category, sort);
        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    }

    try {
        const query = {};

        // Search by product name (case-insensitive)
        if (search && String(search).trim()) {
            query.name = { $regex: String(search).trim(), $options: "i" };
        }

        // Filter by category (case-insensitive)
        if (category && String(category).trim() && String(category).trim().toLowerCase() !== "all" && String(category).trim().toLowerCase() !== "all categories") {
            query.category = { $regex: new RegExp(`^${String(category).trim()}$`, "i") };
        }

        // Bonus: Sort by price
        let sortOption = { createdAt: -1 };
        if (sort === "price_asc") {
            sortOption = { price: 1 };
        } else if (sort === "price_desc") {
            sortOption = { price: -1 };
        }

        const products = await Product.find(query).sort(sortOption);

        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });

    } catch (error) {
        // Fallback to sample catalog if database call times out or fails
        const products = getFallbackFiltered(search, category, sort);
        return res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    }
};

// GET SINGLE PRODUCT BY ID - GET /products/:id
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        if (mongoose.connection.readyState !== 1) {
            const product = fallbackProducts.find(p => p._id === id);
            if (product) {
                return res.status(200).json({ success: true, product });
            }
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const product = await Product.findById(id);

        if (!product) {
            const fallback = fallbackProducts.find(p => p._id === id);
            if (fallback) {
                return res.status(200).json({ success: true, product: fallback });
            }
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        const fallback = fallbackProducts.find(p => p._id === req.params.id);
        if (fallback) {
            return res.status(200).json({ success: true, product: fallback });
        }
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById
};
