const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { sendInvoiceEmail } = require("../utils/mailer");
const authMiddleware = require("../middleware/auth");
const UserSubscription = require("../Model/UserSubscription");

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkey",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mocksecret"
});

/**
 * Check if the current time in IST is outside 10:00 AM - 11:00 AM.
 * IST is UTC + 5.5 hours.
 */
const isPaymentTimeRestricted = () => {
  const date = new Date();
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
  const istTime = new Date(utcTime + (3600000 * 5.5));
  const hour = istTime.getHours();
  return hour < 10 || hour >= 11;
};

// Create a Razorpay order
router.post("/create-order", authMiddleware, async (req, res) => {
  if (isPaymentTimeRestricted()) {
    return res.status(403).json({
      message: "Payments only allowed between 10–11 AM IST"
    });
  }

  const { amount } = req.body;
  const VALID_AMOUNTS = [100, 300, 1000];
  if (!amount || isNaN(amount) || !VALID_AMOUNTS.includes(Number(amount))) {
    return res.status(400).json({
      message: "Invalid plan amount."
    });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_sub_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res.status(500).json({
      message: "Unable to initiate payment transaction."
    });
  }
});

// Verify signature and send invoice email
router.post("/verify-payment", authMiddleware, async (req, res) => {
  if (isPaymentTimeRestricted()) {
    return res.status(403).json({
      message: "Payments only allowed between 10–11 AM IST"
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
    return res.status(400).json({
      message: "Missing required payment details."
    });
  }

  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "mocksecret")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature."
      });
    }

    // Send invoice details via Nodemailer
    await sendInvoiceEmail({
      to: email,
      amount: amount || 0,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });

    const planMapping = {
      100: "Bronze",
      300: "Silver",
      1000: "Gold"
    };
    const planName = planMapping[Number(amount)] || "Standard";

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await UserSubscription.findOneAndUpdate(
      { userEmail: String(email).trim().toLowerCase() },
      {
        planName,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: Number(amount),
        expiresAt
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and invoice sent."
    });
  } catch (error) {
    console.error("Razorpay signature verification failed:", error);
    return res.status(500).json({
      message: "Unable to process payment verification right now."
    });
  }
});

module.exports = router;
