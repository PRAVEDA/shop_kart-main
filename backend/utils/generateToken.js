const jwt = require("jsonwebtoken");
const jwtSecret = require("./jwtSecret");

const generateToken = (customerId) => {
    return jwt.sign(
        { id: customerId },
        jwtSecret,
        { expiresIn: "1d" }
    );
};

module.exports = generateToken;