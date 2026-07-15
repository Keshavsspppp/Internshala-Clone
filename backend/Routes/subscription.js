const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { verifiedAuthMiddleware: authMiddleware } = require("../middleware/auth");
const UserSubscription = require("../Model/UserSubscription");
const { getISTDateKey, getStartOfISTMonthUTC, isWithinISTHourWindow } = require("../utils/istTime");
const { SUBSCRIPTION_PLANS, getPaidPlan } = require("../utils/subscriptionPlans");
const { claimPayment, completePayment, failPayment } = require("../utils/paymentTransactions");
const { queueAndDeliverInvoice } = require("../utils/invoiceDelivery");

const router = express.Router();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required env vars");
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Check if the current time in IST is outside 10:00 AM - 11:00 AM.
 * IST is UTC + 5.5 hours.
 */
const isPaymentTimeRestricted = () => {
  return !isWithinISTHourWindow(10, 11);
};

const signaturesMatch = (generated, received) => {
  const generatedBuffer = Buffer.from(String(generated), "utf8");
  const receivedBuffer = Buffer.from(String(received), "utf8");
  return generatedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
};

// Create a Razorpay order
router.post("/create-order", authMiddleware, async (req, res) => {
  if (isPaymentTimeRestricted()) {
    return res.status(403).json({
      message: "Payments only allowed between 10–11 AM IST"
    });
  }

  const plan = getPaidPlan(req.body);
  const userEmail = String(req.user.email || "").trim().toLowerCase();
  if (!plan || !userEmail) {
    return res.status(400).json({
      message: "Invalid plan amount."
    });
  }

  try {
    const options = {
      amount: plan.amountPaise,
      currency: "INR",
      receipt: `receipt_sub_${Date.now()}`,
      notes: {
        purpose: "subscription",
        planName: plan.name,
        userEmail,
        allowedISTDate: getISTDateKey(),
      },
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return res.status(500).json({
      message: "Unable to initiate payment transaction."
    });
  }
});

// Verify signature and send invoice email
router.post("/verify-payment", authMiddleware, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const email = req.user.email?.toLowerCase();

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
    return res.status(400).json({
      message: "Missing required payment details."
    });
  }

  let claimedTransaction = null;
  try {
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (!signaturesMatch(generatedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature."
      });
    }

    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);
    const plan = getPaidPlan({ planName: order.notes?.planName });
    const orderEmail = String(order.notes?.userEmail || "").trim().toLowerCase();

    if (
      !plan ||
      order.notes?.purpose !== "subscription" ||
      orderEmail !== email ||
      Number(order.amount) !== plan.amountPaise ||
      order.currency !== "INR" ||
      payment.order_id !== razorpay_order_id ||
      Number(payment.amount) !== plan.amountPaise ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match the selected subscription plan."
      });
    }

    const paymentDate = new Date(Number(payment.created_at) * 1000);
    const paymentWasInWindow =
      order.notes?.allowedISTDate === getISTDateKey(paymentDate) &&
      isWithinISTHourWindow(10, 11, paymentDate);
    if (!paymentWasInWindow) {
      if (
        payment.status === "refunded" ||
        Number(payment.amount_refunded || 0) >= plan.amountPaise
      ) {
        return res.status(403).json({
          success: false,
          refunded: true,
          message: "Payment was outside the allowed 10–11 AM IST window and has been refunded."
        });
      }
      if (payment.status === "captured") {
        const refund = await razorpay.payments.refund(razorpay_payment_id, {
          amount: plan.amountPaise,
          notes: { reason: "Payment completed outside 10-11 AM IST" },
        });
        return res.status(403).json({
          success: false,
          refunded: true,
          refundId: refund.id,
          message: "Payment was completed outside 10–11 AM IST and has been refunded."
        });
      }
      return res.status(403).json({
        success: false,
        refunded: payment.status === "refunded",
        message: "Payment was outside the allowed 10–11 AM IST window."
      });
    }
    if (payment.status !== "captured") {
      return res.status(400).json({ success: false, message: "Payment has not been captured." });
    }

    const claim = await claimPayment({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      purpose: "subscription",
      userEmail: email,
      amountPaise: plan.amountPaise,
    });
    if (claim.complete) return res.status(200).json(claim.transaction.result);
    if (claim.conflict) return res.status(409).json({ success: false, message: "Payment was already used for another purchase." });
    if (claim.processing) return res.status(409).json({ success: false, message: "Payment is already being processed." });
    claimedTransaction = claim.transaction;

    const planName = plan.name;

    // Derive the expiry from Razorpay's immutable payment timestamp so a retry
    // can never extend the plan a second time.
    const expiresAt = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    await UserSubscription.findOneAndUpdate(
      { userEmail: String(email).trim().toLowerCase() },
      {
        planName,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: plan.amountRupees,
        expiresAt
      },
      { upsert: true, new: true }
    );

    const invoiceDelivered = await queueAndDeliverInvoice({
      to: email,
      amount: plan.amountRupees,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planName,
    });

    const result = {
      success: true,
      invoiceDelivered,
      planName,
      expiresAt,
      message: invoiceDelivered
        ? "Payment verified successfully and invoice sent."
        : "Payment verified successfully. Invoice delivery is queued for retry."
    };
    await completePayment(claimedTransaction, result);
    return res.status(200).json(result);
  } catch (error) {
    await failPayment(claimedTransaction, error);
    console.error("Razorpay signature verification failed:", error);
    return res.status(500).json({
      message: "Unable to process payment verification right now."
    });
  }
});

// GET /status — Get current user subscription status
router.get("/status", authMiddleware, async (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  if (!userEmail) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const sub = await UserSubscription.findOne({
      userEmail,
      expiresAt: { $gt: new Date() }
    });

    const planName = sub ? sub.planName : "Free";
    const expiresAt = sub ? sub.expiresAt : null;

    const limit = SUBSCRIPTION_PLANS[planName]?.applicationLimit ?? 1;

    const ApplicationModel = require("../Model/Application");
    const startOfMonth = getStartOfISTMonthUTC();

    const applicationsUsed = await ApplicationModel.countDocuments({
      "user.email": userEmail,
      applicationType: "internship",
      createdAt: { $gte: startOfMonth }
    });

    return res.status(200).json({
      planName,
      expiresAt,
      applicationsUsed,
      limit
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
