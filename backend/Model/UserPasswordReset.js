const mongoose = require("mongoose");

const UserPasswordResetSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  resetDateKey: { type: String, required: true },
  lastResetAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model("UserPasswordReset", UserPasswordResetSchema);
