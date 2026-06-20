const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AdminCredential = require("../Model/AdminCredential");

const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@internarea.com";
const DEFAULT_ADMIN_PHONE = process.env.ADMIN_PHONE || "9999999999";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const passwordHash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return { passwordHash, passwordSalt: salt };
};

const verifyPassword = (password, passwordSalt, passwordHash) => {
  const hashedInput = crypto
    .scryptSync(password, passwordSalt, 64)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hashedInput, "hex"),
    Buffer.from(passwordHash, "hex")
  );
};

const generateRandomPassword = (length = 12) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let generatedPassword = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    generatedPassword += characters[randomIndex];
  }

  return generatedPassword;
};

const isSameDay = (firstDate, secondDate) => {
  if (!firstDate || !secondDate) {
    return false;
  }

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
};

const normalizePhone = (phone = "") => phone.replace(/\D/g, "");

const ensureAdminAccount = async () => {
  let adminAccount = await AdminCredential.findOne({
    username: DEFAULT_ADMIN_USERNAME,
  });

  if (adminAccount) {
    return adminAccount;
  }

  const { passwordHash, passwordSalt } = hashPassword(DEFAULT_ADMIN_PASSWORD);

  adminAccount = await AdminCredential.create({
    username: DEFAULT_ADMIN_USERNAME,
    email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
    phone: normalizePhone(DEFAULT_ADMIN_PHONE),
    passwordHash,
    passwordSalt,
  });

  return adminAccount;
};

router.post("/adminlogin", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Username and password are required");
  }

  try {
    await ensureAdminAccount();
    const adminAccount = await AdminCredential.findOne({ username: username.trim() });

    if (
      !adminAccount ||
      !verifyPassword(password, adminAccount.passwordSalt, adminAccount.passwordHash)
    ) {
      return res.status(401).send("Unauthorized");
    }

    const token = jwt.sign(
      { username: adminAccount.username, role: "admin" },
      process.env.ADMIN_JWT_SECRET || "super-secret-admin-key",
      { expiresIn: "7d" }
    );

    return res.status(200).json({ success: true, message: "Login successful.", token });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).send("Unable to process login right now");
  }
});

router.post("/forgot-password", async (req, res) => {
  const rawIdentifier = req.body.identifier || req.body.email || req.body.phone;
  const identifier = String(rawIdentifier || "").trim();

  if (!identifier) {
    return res.status(400).json({
      message: "Please enter your registered email or phone number.",
    });
  }

  try {
    await ensureAdminAccount();

    const normalizedIdentifier = normalizePhone(identifier);
    const adminAccount = await AdminCredential.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: normalizedIdentifier },
      ],
    });

    if (!adminAccount) {
      return res.status(404).json({
        message: "No account was found with that email or phone number.",
      });
    }

    if (
      isSameDay(adminAccount.lastResetAt, new Date()) ||
      isSameDay(adminAccount.lastPasswordResetAt, new Date())
    ) {
      return res.status(429).json({
        message: "You can use this option only once per day.",
      });
    }

    const newPassword = generateRandomPassword(12);
    const { passwordHash, passwordSalt } = hashPassword(newPassword);

    adminAccount.passwordHash = passwordHash;
    adminAccount.passwordSalt = passwordSalt;
    adminAccount.lastPasswordResetAt = new Date();
    adminAccount.lastResetAt = new Date();
    await adminAccount.save();

    return res.json({
      message: "Your password has been reset successfully.",
      newPassword,
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return res.status(500).json({
      message: "Unable to reset the password right now.",
    });
  }
});

module.exports = router;
