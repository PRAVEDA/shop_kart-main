const dns = require("dns");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4", "208.67.222.222"]);
const backendEnvPath = path.resolve(__dirname, ".env");
const rootEnvPath = path.resolve(__dirname, "../.env");
const selectedEnvPath = fs.existsSync(backendEnvPath) ? backendEnvPath : rootEnvPath;
const dotenvResult = dotenv.config({ path: selectedEnvPath });
const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
console.info("[Razorpay config]", JSON.stringify({
    envFile: path.relative(__dirname, selectedEnvPath),
    dotenvLoaded: Boolean(dotenvResult.parsed),
    mode: process.env.RAZORPAY_MODE || "test",
    keyIdPresent: Boolean(razorpayKeyId),
    keyIdPrefix: razorpayKeyId?.slice(0, 9) || null,
    keySecretPresent: Boolean(process.env.RAZORPAY_KEY_SECRET?.trim()),
}));

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();


// CORS middleware for credentials & frontend origin
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
    } else {
        res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// Middleware
app.use(express.json());
app.use(cookieParser());


// Routes
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);


// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "ShopKart Backend is running"
    });
});


// Connect MongoDB and start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error.message);
        console.log("Tip: If using MongoDB Atlas, verify your current IP is whitelisted (or allow 0.0.0.0/0).");
    });