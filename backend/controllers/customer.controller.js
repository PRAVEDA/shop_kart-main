const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");


// REGISTER
const registerCustomer = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body || {};

        // Check required fields
        if (
            !fullName ||
            !email ||
            !password ||
            !phone ||
            !String(fullName).trim() ||
            !String(email).trim() ||
            !String(phone).trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check password length
        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const { inMemoryCustomers } = require("../utils/inMemoryStore");

        if (require("mongoose").connection.readyState !== 1) {
            // Check in-memory store
            for (const c of inMemoryCustomers.values()) {
                if (c.email === normalizedEmail) {
                    return res.status(409).json({
                        success: false,
                        message: "Email already exists"
                    });
                }
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const id = new (require("mongoose")).Types.ObjectId().toString();
            const memCustomer = {
                _id: id,
                fullName: String(fullName).trim(),
                email: normalizedEmail,
                password: hashedPassword,
                phone: String(phone).trim()
            };
            inMemoryCustomers.set(id, memCustomer);

            return res.status(201).json({
                success: true,
                message: "Customer registered successfully",
                customer: {
                    _id: memCustomer._id,
                    fullName: memCustomer.fullName,
                    email: memCustomer.email,
                    phone: memCustomer.phone
                }
            });
        }

        // Check if email already exists
        const existingCustomer = await Customer.findOne({ email: normalizedEmail });

        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer
        const customer = await Customer.create({
            fullName: String(fullName).trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: String(phone).trim()
        });

        // Send response without password
        return res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            customer: {
                _id: customer._id,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// LOGIN
const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        let customer = null;
        if (require("mongoose").connection.readyState === 1) {
            customer = await Customer.findOne({ email: normalizedEmail });
        } else {
            const { inMemoryCustomers } = require("../utils/inMemoryStore");
            for (const c of inMemoryCustomers.values()) {
                if (c.email === normalizedEmail) {
                    customer = c;
                    break;
                }
            }
        }

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            customer.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Generate JWT
        const token = generateToken(customer._id);

        // Store JWT in HttpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            customer: {
                _id: customer._id,
                fullName: customer.fullName,
                email: customer.email,
                phone: customer.phone
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// GET MY PROFILE
const getMyProfile = async (req, res) => {
    try {
        return res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            phone: req.user.phone
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// LOGOUT
const logoutCustomer = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// BONUS: CHANGE PASSWORD
const changePassword = async (req, res) => {
    try {
        const { oldPassword, currentPassword, newPassword } = req.body || {};
        const previousPassword = oldPassword || currentPassword;

        if (!previousPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Old password and new password are required"
            });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters"
            });
        }

        // Fetch user with password
        const customer = await Customer.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        // Verify old password
        const isMatch = await bcrypt.compare(previousPassword, customer.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect old password"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        customer.password = hashedPassword;
        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    registerCustomer,
    loginCustomer,
    getMyProfile,
    logoutCustomer,
    changePassword
};