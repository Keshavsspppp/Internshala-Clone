const mongoose = require("mongoose");
const fs = require("fs");
const { hasEmailDeliveryConfig } = require("./mailer");

const hasFirebaseCredentialConfig = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return Boolean(account.project_id && account.client_email && account.private_key);
    } catch {
      return false;
    }
  }
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) return true;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
  return false;
};

const getConfigurationStatus = () => ({
  database: mongoose.connection.readyState === 1,
  allowedOrigins: Boolean(process.env.ALLOWED_ORIGINS),
  firebaseProject: Boolean(process.env.FIREBASE_PROJECT_ID),
  firebaseCredentials: hasFirebaseCredentialConfig(),
  firebaseStorage: Boolean(process.env.FIREBASE_STORAGE_BUCKET),
  emailDelivery: hasEmailDeliveryConfig(),
  razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  cloudinary: Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ),
  adminSessionSecret: Boolean(process.env.ADMIN_JWT_SECRET),
  userSessionSecret: Boolean(process.env.USER_SESSION_JWT_SECRET),
  languageSessionSecret: Boolean(
    process.env.LANGUAGE_JWT_SECRET || process.env.ADMIN_JWT_SECRET
  ),
});

const isConfigurationReady = (checks = getConfigurationStatus()) =>
  Object.values(checks).every(Boolean);

module.exports = {
  getConfigurationStatus,
  hasFirebaseCredentialConfig,
  isConfigurationReady,
};
