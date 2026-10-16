const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");
const jwtSecret = require("../utils/jwtSecret");

const authMiddleware = async (req, res, next) => {
    try {
        let token = req.cookies?.token;

        // Fallback to Authorization header if cookie is absent (helps with versatile API testing)
        if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const decoded = jwt.verify(token, jwtSecret);

        let customer = null;
        if (require("mongoose").connection.readyState === 1) {
            try {
                customer = await Customer.findById(decoded.id).select("-password");
            } catch (err) {
                // fall through to in-memory store
            }
        }

        if (!customer) {
            const { inMemoryCustomers } = require("../utils/inMemoryStore");
            const memCustomer = inMemoryCustomers.get(decoded.id);
            if (memCustomer) {
                customer = {
                    _id: memCustomer._id,
                    fullName: memCustomer.fullName,
                    email: memCustomer.email,
                    phone: memCustomer.phone
                };
            }
        }

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        req.user = customer;

        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
};

module.exports = authMiddleware;