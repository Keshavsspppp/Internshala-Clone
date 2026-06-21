const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const jwt = require("jsonwebtoken");

// Initialize Firebase Admin if not already initialized
if (admin.getApps().length === 0) {
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  if (!firebaseProjectId) {
    throw new Error("FIREBASE_PROJECT_ID env var is required");
  }

  let credential;

  // Option 1: Load from service account JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err);
    }
  }
  // Option 2: Load from specific env variables
  else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    credential = admin.credential.cert({
      projectId: firebaseProjectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  // Option 3: Fall back to GOOGLE_APPLICATION_CREDENTIALS path if set
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.applicationDefault();
  }

  const options = {
    projectId: firebaseProjectId
  };
  if (credential) {
    options.credential = credential;
  }
  admin.initializeApp(options);
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Token is empty." });
  }

  try {
    // 1. Try to verify as Firebase ID Token
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (firebaseError) {
      // 2. If Firebase verification fails, check if it's an Admin JWT
      const adminSecret = process.env.ADMIN_JWT_SECRET;
      if (!adminSecret) {
        console.error("ADMIN_JWT_SECRET env var is required");
        return res.status(500).json({ error: "Internal server error. Session verification misconfigured." });
      }
      try {
        const decodedAdmin = jwt.verify(token, adminSecret);
        if (decodedAdmin.role === "admin") {
          req.user = decodedAdmin;
          return next();
        }
      } catch (jwtError) {
        // Both verification attempts failed
        console.error(
          "Auth verification failed. Firebase error:",
          firebaseError.message,
          "JWT error:",
          jwtError.message
        );
        return res.status(401).json({ error: "Unauthorized. Invalid token." });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Unauthorized." });
  }
};

module.exports = authMiddleware;
