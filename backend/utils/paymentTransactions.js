const PaymentTransaction = require("../Model/PaymentTransaction");

const claimPayment = async ({ paymentId, orderId, purpose, userEmail, amountPaise }) => {
  try {
    const transaction = await PaymentTransaction.create({
      paymentId, orderId, purpose, userEmail, amountPaise, status: "processing",
    });
    return { claimed: true, transaction };
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await PaymentTransaction.findOne({
      $or: [{ paymentId }, { orderId }],
    });
    const samePayment = existing &&
      existing.paymentId === paymentId &&
      existing.orderId === orderId &&
      existing.purpose === purpose &&
      existing.userEmail === userEmail &&
      existing.amountPaise === amountPaise;
    if (!samePayment) return { claimed: false, conflict: true, transaction: existing };
    if (existing.status === "complete") return { claimed: false, complete: true, transaction: existing };
    if (existing.status === "processing") return { claimed: false, processing: true, transaction: existing };

    const retry = await PaymentTransaction.findOneAndUpdate(
      { _id: existing._id, status: "failed" },
      { $set: { status: "processing", error: "" } },
      { new: true }
    );
    return retry
      ? { claimed: true, transaction: retry }
      : { claimed: false, processing: true, transaction: existing };
  }
};

const completePayment = (transaction, result) =>
  PaymentTransaction.findByIdAndUpdate(
    transaction._id,
    { $set: { status: "complete", result, error: "" } },
    { new: true }
  );

const failPayment = (transaction, error) =>
  transaction
    ? PaymentTransaction.findOneAndUpdate(
        { _id: transaction._id, status: "processing" },
        { $set: { status: "failed", error: String(error?.message || error).slice(0, 1000) } }
      )
    : Promise.resolve();

module.exports = { claimPayment, completePayment, failPayment };
