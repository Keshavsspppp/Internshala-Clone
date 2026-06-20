const express = require("express");
const crypto = require("crypto");
const UserSecurity = require("../Model/UserSecurity");
const { sendOtpEmail } = require("../utils/mailer");

const router = express.Router();

const LOGIN_HISTORY_LIMIT = 20;
const OTP_EXPIRY_MINUTES = 10;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const normalizeUser = (user = {}) => ({
  uid: String(user.uid || "").trim(),
  name: String(user.name || "InternArea User").trim(),
  email: normalizeEmail(user.email),
  photo: String(user.photo || ""),
});

const getClientIp = (req) => {
  const forwardedIp = req.headers["x-forwarded-for"];

  if (typeof forwardedIp === "string" && forwardedIp.trim()) {
    return forwardedIp.split(",")[0].trim();
  }

  return String(req.socket?.remoteAddress || "");
};

const getCurrentHour = () => {
  return new Date().getHours();
};

const isMobileAllowedRightNow = () => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istHour = new Date(Date.now() + istOffset).getUTCHours();
  return istHour >= 10 && istHour < 13;
};

const createOtpHash = (otp) => {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
};

const createAttemptId = () => crypto.randomBytes(12).toString("hex");

const createOtp = () => String(crypto.randomInt(100000, 1000000));

const appendAttempt = (userSecurity, attempt) => {
  userSecurity.loginHistory.unshift(attempt);
  userSecurity.loginHistory = userSecurity.loginHistory.slice(0, LOGIN_HISTORY_LIMIT);
};

const findAttemptIndex = (userSecurity, attemptId) => {
  return userSecurity.loginHistory.findIndex(
    (attempt) => attempt.attemptId === attemptId
  );
};

const buildHistorySummary = (history = []) => {
  const successfulStatuses = new Set(["allowed", "verified"]);
  const blockedAttempts = history.filter((item) => item.status === "blocked").length;
  const successfulLogins = history.filter((item) =>
    successfulStatuses.has(item.status)
  ).length;

  return {
    totalAttempts: history.length,
    successfulLogins,
    blockedAttempts,
  };
};

const serializeHistoryItem = (item) => ({
  attemptId: item.attemptId,
  browser: item.browser,
  operatingSystem: item.operatingSystem,
  deviceType: item.deviceType,
  ipAddress: item.ipAddress,
  status: item.status,
  reason: item.reason,
  otpVerifiedAt: item.otpVerifiedAt,
  failedOtpCount: item.failedOtpCount,
  createdAt: item.createdAt,
});

const serializeProfile = (userSecurity) => ({
  uid: userSecurity.uid,
  name: userSecurity.name,
  email: userSecurity.email,
  photo: userSecurity.photo,
  lastSuccessfulLoginAt: userSecurity.lastSuccessfulLoginAt,
  summary: buildHistorySummary(userSecurity.loginHistory || []),
  loginHistory: (userSecurity.loginHistory || []).map(serializeHistoryItem),
});

router.post("/login-attempt", async (req, res) => {
  const normalizedUser = normalizeUser(req.body.user);
  const loginEnvironment = req.body.loginEnvironment || {};

  if (!normalizedUser.uid || !normalizedUser.email) {
    return res.status(400).json({
      message: "A signed-in Google user with email is required.",
    });
  }

  const browser = String(loginEnvironment.browser || "Unknown").trim() || "Unknown";
  const operatingSystem =
    String(loginEnvironment.operatingSystem || "Unknown").trim() || "Unknown";
  const deviceType = ["desktop", "laptop", "mobile"].includes(
    String(loginEnvironment.deviceType || "").trim()
  )
    ? String(loginEnvironment.deviceType).trim()
    : "desktop";
  const ipAddress = getClientIp(req);
  const attemptId = createAttemptId();

  try {
    let userSecurity = await UserSecurity.findOne({ uid: normalizedUser.uid });

    if (!userSecurity) {
      userSecurity = await UserSecurity.create({
        ...normalizedUser,
        loginHistory: [],
      });
    } else {
      userSecurity.name = normalizedUser.name;
      userSecurity.email = normalizedUser.email;
      userSecurity.photo = normalizedUser.photo;
    }

    if (deviceType === "mobile" && !isMobileAllowedRightNow()) {
      appendAttempt(userSecurity, {
        attemptId,
        browser,
        operatingSystem,
        deviceType,
        ipAddress,
        status: "blocked",
        reason: "Mobile login is allowed only between 10:00 AM and 1:00 PM.",
      });

      await userSecurity.save();

      return res.status(403).json({
        status: "blocked",
        attemptId,
        message: "Mobile login is allowed only between 10:00 AM and 1:00 PM.",
      });
    }

    if (browser.toLowerCase() === "chrome") {
      const otp = createOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      appendAttempt(userSecurity, {
        attemptId,
        browser,
        operatingSystem,
        deviceType,
        ipAddress,
        status: "otp_required",
        reason: "OTP verification is required for Google Chrome logins.",
      });

      userSecurity.pendingOtp = {
        attemptId,
        codeHash: createOtpHash(otp),
        expiresAt,
      };

      const emailResult = await sendOtpEmail({
        to: normalizedUser.email,
        otp,
        browser,
        deviceType,
        operatingSystem,
      });

      await userSecurity.save();

      return res.status(200).json({
        status: "otp_required",
        attemptId,
        expiresAt,
        message: "OTP verification is required for this login.",
        developmentOtpPreview: emailResult.developmentOtpPreview || null,
      });
    }

    appendAttempt(userSecurity, {
      attemptId,
      browser,
      operatingSystem,
      deviceType,
      ipAddress,
      status: "allowed",
      reason: "Login allowed.",
    });

    userSecurity.pendingOtp = {};
    userSecurity.lastSuccessfulLoginAt = new Date();
    await userSecurity.save();

    return res.status(200).json({
      status: "allowed",
      attemptId,
      message: "Login allowed.",
    });
  } catch (error) {
    console.error("Unable to record login attempt:", error);
    return res.status(500).json({
      message: "Unable to process the login attempt right now.",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const normalizedUser = normalizeUser(req.body.user);
  const attemptId = String(req.body.attemptId || "").trim();
  const otp = String(req.body.otp || "").trim();

  if (!normalizedUser.uid || !normalizedUser.email || !attemptId || !otp) {
    return res.status(400).json({
      message: "User, attempt id, and OTP are required.",
    });
  }

  try {
    const userSecurity = await UserSecurity.findOne({ uid: normalizedUser.uid });

    if (!userSecurity) {
      return res.status(404).json({
        message: "No login attempt found for this user.",
      });
    }

    if (
      !userSecurity.pendingOtp?.attemptId ||
      userSecurity.pendingOtp.attemptId !== attemptId
    ) {
      return res.status(400).json({
        message: "This OTP session is no longer valid.",
      });
    }

    if (!userSecurity.pendingOtp.expiresAt || userSecurity.pendingOtp.expiresAt < new Date()) {
      const expiredAttemptIndex = findAttemptIndex(userSecurity, attemptId);

      if (expiredAttemptIndex >= 0) {
        userSecurity.loginHistory[expiredAttemptIndex].status = "blocked";
        userSecurity.loginHistory[expiredAttemptIndex].reason =
          "OTP expired before verification.";
      }

      userSecurity.pendingOtp = {};
      await userSecurity.save();

      return res.status(400).json({
        message: "OTP has expired. Please sign in again.",
      });
    }

    if (createOtpHash(otp) !== userSecurity.pendingOtp.codeHash) {
      const invalidAttemptIndex = findAttemptIndex(userSecurity, attemptId);

      if (invalidAttemptIndex >= 0) {
        userSecurity.loginHistory[invalidAttemptIndex].failedOtpCount += 1;
        if (userSecurity.loginHistory[invalidAttemptIndex].failedOtpCount >= 5) {
          userSecurity.pendingOtp = {}; // invalidate
          await userSecurity.save();
          return res.status(429).json({ message: "Too many failed attempts." });
        }
        await userSecurity.save();
      }

      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
      });
    }

    const verifiedAttemptIndex = findAttemptIndex(userSecurity, attemptId);

    if (verifiedAttemptIndex >= 0) {
      userSecurity.loginHistory[verifiedAttemptIndex].status = "verified";
      userSecurity.loginHistory[verifiedAttemptIndex].reason =
        "Chrome login verified with OTP.";
      userSecurity.loginHistory[verifiedAttemptIndex].otpVerifiedAt = new Date();
    }

    userSecurity.pendingOtp = {};
    userSecurity.lastSuccessfulLoginAt = new Date();
    userSecurity.name = normalizedUser.name;
    userSecurity.email = normalizedUser.email;
    userSecurity.photo = normalizedUser.photo;
    await userSecurity.save();

    return res.status(200).json({
      status: "verified",
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Unable to verify OTP:", error);
    return res.status(500).json({
      message: "Unable to verify the OTP right now.",
    });
  }
});

router.get("/profile", async (req, res) => {
  const uid = String(req.query.uid || "").trim();
  const email = normalizeEmail(req.query.email);

  if (!uid && !email) {
    return res.status(400).json({
      message: "uid or email is required.",
    });
  }

  try {
    const userSecurity = await UserSecurity.findOne(
      uid ? { uid } : { email }
    );

    if (!userSecurity) {
      return res.status(404).json({
        message: "No login history found for this user yet.",
      });
    }

    return res.status(200).json(serializeProfile(userSecurity));
  } catch (error) {
    console.error("Unable to fetch user security profile:", error);
    return res.status(500).json({
      message: "Unable to fetch login history right now.",
    });
  }
});

module.exports = router;
