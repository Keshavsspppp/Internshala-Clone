const mongoose = require("mongoose");
require("dotenv").config();

const url = process.env.DATABASE_URL;

async function makeGold() {
  await mongoose.connect(url);
  console.log("Connected to database.");

  const UserSecurity = require("./Model/UserSecurity");
  const UserSubscription = require("./Model/UserSubscription");

  // Check if email passed as argument
  let targetEmails = [];
  const argEmail = process.argv[2];
  if (argEmail && argEmail.includes("@")) {
    targetEmails = [argEmail.trim().toLowerCase()];
  } else {
    // Fallback: upgrade all users who have attempted to log in
    const logs = await UserSecurity.find({});
    targetEmails = logs.map(u => u.email).filter(Boolean);
  }

  if (targetEmails.length === 0) {
    console.log("No email provided and no users found in UserSecurity.");
    console.log("Usage: node scratch_gold.js <user_email>");
    console.log("Or make sure you sign in on the frontend first so your email is recorded.");
    process.exit(0);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 365); // 1 year expiry

  for (const email of targetEmails) {
    const userEmail = email.toLowerCase().trim();
    await UserSubscription.findOneAndUpdate(
      { userEmail },
      {
        planName: "Gold",
        paymentId: "mock_gold_payment_id",
        orderId: "mock_gold_order_id",
        amount: 1000,
        expiresAt
      },
      { upsert: true, new: true }
    );
    console.log(`Successfully upgraded ${userEmail} to Gold tier for 1 year.`);
  }

  process.exit(0);
}

makeGold().catch(err => {
  console.error("Upgrade script failed:", err);
  process.exit(1);
});
