const mongoose = require("mongoose");

const UsageQuotaSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  count: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

UsageQuotaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("UsageQuota", UsageQuotaSchema);
