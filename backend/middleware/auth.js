const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "internarea-80bb2"
  });
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
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      return next();
    } catch (firebaseError) {
      // 2. If Firebase verification fails, check if it's an Admin JWT
      const adminSecret = process.env.ADMIN_JWT_SECRET || "super-secret-admin-key";
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
