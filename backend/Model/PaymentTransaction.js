const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, unique: true, index: true },
  purpose: { type: String, enum: ["subscription", "resume"], required: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  amountPaise: { type: Number, required: true },
  status: { type: String, enum: ["processing", "complete", "failed"], default: "processing" },
  result: { type: mongoose.Schema.Types.Mixed, default: {} },
  error: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("PaymentTransaction", PaymentTransactionSchema);
