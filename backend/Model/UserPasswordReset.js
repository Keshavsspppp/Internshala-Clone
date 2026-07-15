const mongoose = require("mongoose");

const UserPasswordResetSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  resetDateKey: { type: String, required: true },
  lastResetAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ["processing", "completed", "failed"],
    default: "processing",
  },
  reservationId: { type: String, default: "" },
  processingExpiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("UserPasswordReset", UserPasswordResetSchema);
