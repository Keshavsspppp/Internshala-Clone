const jwt = require("jsonwebtoken");

const getUserSessionSecret = () => {
  const secret = process.env.USER_SESSION_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!secret) throw new Error("USER_SESSION_JWT_SECRET or ADMIN_JWT_SECRET is required");
  return secret;
};

const issueUserSession = ({ uid, email, attemptId }) =>
  jwt.sign(
    {
      uid,
      email: String(email || "").toLowerCase(),
      attemptId,
      purpose: "verified-user-session",
    },
    getUserSessionSecret(),
    { expiresIn: "12h" }
  );

const verifyUserSession = (token) =>
  jwt.verify(token, getUserSessionSecret());

module.exports = { issueUserSession, verifyUserSession };
