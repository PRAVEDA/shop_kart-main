const express = require("express");
const {
    createProduct,
    getAllProducts,
    getProductById
} = require("../controllers/product.controller");

const router = express.Router();

// Create Product
router.post("/", createProduct);

// Get All Products (supports ?search= & ?category= & ?sort=)
router.get("/", getAllProducts);

// Get Single Product by ID
router.get("/:id", getProductById);

module.exports = router;
