const Razorpay = require("razorpay");

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_shopkart1234";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "shopkart_test_secret_1234";
  return new Razorpay({
    key_id,
    key_secret,
  });
}

// Dynamic proxy so it always uses latest environment variables if updated at runtime
const razorpayProxy = new Proxy({}, {
  get(target, prop) {
    const instance = getRazorpayInstance();
    const val = instance[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  }
});

module.exports = razorpayProxy;
