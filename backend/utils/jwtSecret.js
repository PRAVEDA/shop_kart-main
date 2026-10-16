const crypto = require("crypto");

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("JWT_SECRET must be configured in production");
    }

    process.env.JWT_SECRET = crypto.randomBytes(32).toString("hex");
    console.warn("JWT_SECRET is unset; using an ephemeral development secret.");
}

module.exports = process.env.JWT_SECRET;