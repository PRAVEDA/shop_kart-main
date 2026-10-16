const crypto = require("crypto");

const verifyRazorpaySignature = ({ orderId, paymentId, signature, secret }) => {
    if (
        typeof orderId !== "string" ||
        typeof paymentId !== "string" ||
        typeof secret !== "string" ||
        typeof signature !== "string" ||
        !/^[a-f0-9]{64}$/i.test(signature)
    ) {
        return false;
    }

    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest();
    const received = Buffer.from(signature, "hex");

    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

module.exports = verifyRazorpaySignature;