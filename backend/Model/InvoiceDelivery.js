const mongoose = require("mongoose");

const InvoiceDeliverySchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  to: { type: String, required: true, lowercase: true, trim: true },
  amount: { type: Number, required: true },
  orderId: { type: String, required: true },
  planName: { type: String, required: true },
  status: { type: String, enum: ["pending", "sending", "sent"], default: "pending", index: true },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  sentAt: { type: Date, default: null },
  lastError: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("InvoiceDelivery", InvoiceDeliverySchema);
