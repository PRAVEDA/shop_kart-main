const express = require("express");

const {
    registerCustomer,
    loginCustomer,
    getMyProfile,
    logoutCustomer,
    changePassword
} = require("../controllers/customer.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();


// Register
router.post("/register", registerCustomer);


// Login
router.post("/login", loginCustomer);


// My Profile - Protected
router.get("/me", authMiddleware, getMyProfile);


// Logout - Protected
router.post("/logout", authMiddleware, logoutCustomer);


// Change Password - Protected (Bonus Challenge)
router.patch("/change-password", authMiddleware, changePassword);


module.exports = router;