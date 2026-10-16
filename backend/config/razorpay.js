const Razorpay = require("razorpay");

function getRazorpayCredentials() {
  const mode = (process.env.RAZORPAY_MODE || "test").trim().toLowerCase();
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (mode !== "test" && mode !== "live") {
    throw new Error("RAZORPAY_MODE must be either test or live");
  }

  if (
    !keyId ||
    !keySecret ||
    keyId.toLowerCase().includes("replace") ||
    keySecret.toLowerCase().includes("replace")
  ) {
    throw new Error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend environment");
  }

  const expectedPrefix = mode === "test" ? "rzp_test_" : "rzp_live_";
  if (!keyId.startsWith(expectedPrefix)) {
    throw new Error(`RAZORPAY_KEY_ID must start with ${expectedPrefix} when RAZORPAY_MODE=${mode}`);
  }

  return { mode, keyId, keySecret };
}

function createRazorpayClient(credentials = getRazorpayCredentials()) {
  return new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  });
}

module.exports = { createRazorpayClient, getRazorpayCredentials };
