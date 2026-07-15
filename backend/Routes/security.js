const express = require("express");
const crypto = require("crypto");
const UserSecurity = require("../Model/UserSecurity");
const { sendOtpEmail, sendUserPasswordEmail } = require("../utils/mailer");
const authMiddleware = require("../middleware/auth");
const { verifiedAuthMiddleware } = require("../middleware/auth");
const UAParser = require("ua-parser-js");
const jwt = require("jsonwebtoken");
const { isWithinISTHourWindow } = require("../utils/istTime");
const { issueUserSession } = require("../utils/userSession");
const { getAuth } = require("firebase-admin/auth");
const UserPasswordReset = require("../Model/UserPasswordReset");
const { getISTDateKey } = require("../utils/istTime");

const router = express.Router();

const getLanguageTokenSecret = () => {
  const secret = process.env.LANGUAGE_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("LANGUAGE_JWT_SECRET or ADMIN_JWT_SECRET is required");
  }
  return secret;
};

const LOGIN_HISTORY_LIMIT = 20;
const OTP_EXPIRY_MINUTES = 10;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const generateLetterPassword = (length = 12) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return Array.from({ length }, () => letters[crypto.randomInt(0, letters.length)]).join("");
};

router.post("/forgot-password", async (req, res) => {
  const identifier = String(req.body.identifier || "").trim();
  if (!identifier) return res.status(400).json({ message: "Registered email or phone number is required." });

  try {
    let firebaseUser;
    if (identifier.includes("@")) {
      firebaseUser = await getAuth().getUserByEmail(normalizeEmail(identifier));
    } else {
      const digits = identifier.replace(/\D/g, "");
      const phone = identifier.startsWith("+") ? `+${digits}` : digits.length === 10 ? `+91${digits}` : `+${digits}`;
      firebaseUser = await getAuth().getUserByPhoneNumber(phone);
    }
    if (!firebaseUser.email) {
      return res.status(400).json({ message: "This account has no registered email for secure delivery." });
    }

    const resetDateKey = getISTDateKey();
    try {
      await UserPasswordReset.findOneAndUpdate(
        { uid: firebaseUser.uid, resetDateKey: { $ne: resetDateKey } },
        { $set: { email: firebaseUser.email, resetDateKey, lastResetAt: new Date() }, $setOnInsert: { uid: firebaseUser.uid } },
        { upsert: true, new: true }
      );
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(429).json({ message: "You can use this option only once per day." });
      }
      throw error;
    }

    const newPassword = generateLetterPassword();
    await getAuth().updateUser(firebaseUser.uid, { password: newPassword });
    const emailResult = await sendUserPasswordEmail({ to: firebaseUser.email, newPassword });
    if (!emailResult.delivered && !emailResult.developmentPasswordPreview) {
      return res.status(503).json({ message: "Password changed, but delivery failed. Contact support immediately." });
    }
    return res.status(200).json({
      message: "Password sent to your registered email.",
      developmentPasswordPreview: emailResult.developmentPasswordPreview || null,
    });
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      return res.status(404).json({ message: "No account was found with that email or phone number." });
    }
    console.error("User forgot password failed:", error);
    return res.status(500).json({ message: "Unable to reset the password right now." });
  }
});

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

const isMobileAllowedRightNow = () => {
  return isWithinISTHourWindow(10, 13);
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
  resumeUrl: userSecurity.resumeUrl || "",
  summary: buildHistorySummary(userSecurity.loginHistory || []),
  loginHistory: (userSecurity.loginHistory || []).map(serializeHistoryItem),
});

router.post("/login-attempt", authMiddleware, async (req, res) => {
  const normalizedUser = normalizeUser({
    uid: req.user.uid,
    name: req.user.name,
    email: req.user.email,
    photo: req.user.picture || req.user.photo || "",
  });
  const loginEnvironment = req.body.loginEnvironment || {};

  if (!normalizedUser.uid || !normalizedUser.email) {
    return res.status(400).json({
      message: "A signed-in Google user with email is required.",
    });
  }

  const ua = new UAParser(req.headers["user-agent"]).getResult();
  const browser = ua.browser.name || "Unknown";
  const operatingSystem = ua.os.name || "Unknown";
  const serverMobileTypes = new Set(["mobile", "tablet"]);
  const serverSaysMobile = serverMobileTypes.has(ua.device.type);
  const reportedDeviceType = ["desktop", "laptop", "mobile"].includes(
    loginEnvironment.deviceType
  )
    ? loginEnvironment.deviceType
    : "desktop";
  const deviceType =
    serverSaysMobile || reportedDeviceType === "mobile"
      ? "mobile"
      : reportedDeviceType === "laptop"
        ? "laptop"
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
      const emailDeliveryFailed =
        !emailResult.delivered && !emailResult.developmentOtpPreview;
      if (emailDeliveryFailed) {
        const failedAttemptIndex = findAttemptIndex(userSecurity, attemptId);
        if (failedAttemptIndex >= 0) {
          userSecurity.loginHistory[failedAttemptIndex].status = "blocked";
          userSecurity.loginHistory[failedAttemptIndex].reason =
            "Login OTP email could not be delivered.";
        }
        userSecurity.pendingOtp = {};
      }

      try {
        await userSecurity.save();
      } catch (saveError) {
        if (saveError.name === "VersionError") {
          console.warn("Mongoose VersionError detected on save. Reloading and retrying...");
          const latestDoc = await UserSecurity.findOne({ uid: normalizedUser.uid });
          if (latestDoc) {
            latestDoc.pendingOtp = userSecurity.pendingOtp;
            const attemptExists = (latestDoc.loginHistory || []).some(
              h => h.attemptId === attemptId
            );
            const currentAttempt = (userSecurity.loginHistory || []).find(
              (historyItem) => historyItem.attemptId === attemptId
            );
            if (!attemptExists && currentAttempt) {
              latestDoc.loginHistory.unshift(currentAttempt);
              latestDoc.loginHistory = latestDoc.loginHistory.slice(0, LOGIN_HISTORY_LIMIT);
            }
            await latestDoc.save();
          }
        } else {
          throw saveError;
        }
      }

      if (emailDeliveryFailed) {
        return res.status(503).json({
          status: "blocked",
          message: "The login verification email could not be delivered. Please try again later.",
        });
      }

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
      sessionToken: issueUserSession({ ...normalizedUser, attemptId }),
      message: "Login allowed.",
    });
  } catch (error) {
    console.error("Unable to record login attempt:", error);
    return res.status(500).json({
      message: "Unable to process the login attempt right now.",
    });
  }
});

router.post("/verify-otp", authMiddleware, async (req, res) => {
  const normalizedUser = normalizeUser({
    uid: req.user.uid,
    name: req.user.name,
    email: req.user.email,
    photo: req.user.picture || req.user.photo || "",
  });
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
      sessionToken: issueUserSession({ ...normalizedUser, attemptId }),
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Unable to verify OTP:", error);
    return res.status(500).json({
      message: "Unable to verify the OTP right now.",
    });
  }
});

router.get("/profile", verifiedAuthMiddleware, async (req, res) => {
  const uid = String(req.user.uid || "").trim();
  const email = normalizeEmail(req.user.email);

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

    const UserSubscription = require("../Model/UserSubscription");
    const subscription = await UserSubscription.findOne({ userEmail: userSecurity.email });
    const resumeUrl = subscription ? (subscription.resumeUrl || "") : "";

    const serialized = serializeProfile(userSecurity);
    serialized.resumeUrl = resumeUrl;

    return res.status(200).json(serialized);
  } catch (error) {
    console.error("Unable to fetch user security profile:", error);
    return res.status(500).json({
      message: "Unable to fetch login history right now.",
    });
  }
});

// POST /send-lang-otp — Send verification OTP for language switching
router.post("/send-lang-otp", verifiedAuthMiddleware, async (req, res) => {
  const email = req.user.email?.toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const LangOtp = require("../Model/LangOtp");
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await LangOtp.findOneAndUpdate(
      { email },
      { otpHash, expiresAt, verified: false, verifiedAt: null, failedAttempts: 0 },
      { upsert: true, new: true }
    );

    const emailResult = await sendOtpEmail({
      to: email,
      otp,
      browser: "Language Switcher",
      deviceType: "desktop",
      operatingSystem: "System"
    });

    if (!emailResult.delivered && !emailResult.developmentOtpPreview) {
      await LangOtp.deleteOne({ email });
      return res.status(503).json({ message: "The language verification email could not be delivered." });
    }

    return res.status(200).json({
      message: "OTP sent successfully to your email.",
      developmentOtpPreview: emailResult.developmentOtpPreview || null
    });
  } catch (error) {
    console.error("Error sending language OTP:", error);
    return res.status(500).json({ message: "Unable to send language OTP." });
  }
});

// POST /verify-lang-otp — Verify language switcher OTP
router.post("/verify-lang-otp", verifiedAuthMiddleware, async (req, res) => {
  const email = req.user.email?.toLowerCase();
  const { otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    const LangOtp = require("../Model/LangOtp");
    const record = await LangOtp.findOne({ email });

    if (!record) {
      return res.status(404).json({ message: "No language verification session found." });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please try again." });
    }

    if (record.failedAttempts >= 5) {
      await record.deleteOne(); // invalidate session
      return res.status(429).json({ message: "Too many failed attempts. Request a new OTP." });
    }

    const inputHash = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");

    if (inputHash !== record.otpHash) {
      record.failedAttempts += 1;
      await record.save();
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    const languageAccessToken = jwt.sign(
      {
        uid: req.user.uid,
        email,
        locale: "fr",
        purpose: "language-access",
      },
      getLanguageTokenSecret(),
      { expiresIn: "24h" }
    );
    await record.deleteOne();

    return res.status(200).json({
      success: true,
      languageAccessToken,
      message: "OTP verified successfully. Language change authorized."
    });
  } catch (error) {
    console.error("Error verifying language OTP:", error);
    return res.status(500).json({ message: "Unable to verify OTP right now." });
  }
});

router.post("/validate-lang-access", verifiedAuthMiddleware, async (req, res) => {
  const token = String(req.body.languageAccessToken || "").trim();
  if (!token) {
    return res.status(401).json({ valid: false, message: "French verification is required." });
  }

  try {
    const payload = jwt.verify(token, getLanguageTokenSecret());
    const valid =
      payload.purpose === "language-access" &&
      payload.locale === "fr" &&
      payload.uid === req.user.uid &&
      String(payload.email || "").toLowerCase() === String(req.user.email || "").toLowerCase();

    if (!valid) {
      return res.status(403).json({ valid: false, message: "French verification is not valid for this user." });
    }
    return res.status(200).json({ valid: true });
  } catch (error) {
    return res.status(401).json({ valid: false, message: "French verification has expired." });
  }
});

router.get("/session", verifiedAuthMiddleware, (req, res) => {
  return res.status(200).json({ valid: true, expiresAt: req.verifiedSession.exp * 1000 });
});

module.exports = router;
