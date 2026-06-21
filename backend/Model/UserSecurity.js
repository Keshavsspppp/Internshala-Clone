const mongoose = require("mongoose");

const LoginAttemptSchema = new mongoose.Schema(
  {
    attemptId: {
      type: String,
      required: true,
      trim: true,
    },
    browser: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    operatingSystem: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "laptop", "mobile"],
      default: "desktop",
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["allowed", "otp_required", "verified", "blocked"],
      required: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    otpVerifiedAt: {
      type: Date,
      default: null,
    },
    failedOtpCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const PendingOtpSchema = new mongoose.Schema(
  {
    attemptId: {
      type: String,
      default: "",
      trim: true,
    },
    codeHash: {
      type: String,
      default: "",
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const UserSecuritySchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    photo: {
      type: String,
      default: "",
    },
    loginHistory: {
      type: [LoginAttemptSchema],
      default: [],
    },
    pendingOtp: {
      type: PendingOtpSchema,
      default: () => ({}),
    },
    lastSuccessfulLoginAt: {
      type: Date,
      default: null,
    },
    resumeUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserSecurity", UserSecuritySchema);
