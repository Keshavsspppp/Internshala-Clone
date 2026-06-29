const mongoose = require("mongoose");

const LangOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically delete expired OTPs after 10 minutes
LangOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Unique index on email to prevent concurrent duplicates
LangOtpSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("LangOtp", LangOtpSchema);
