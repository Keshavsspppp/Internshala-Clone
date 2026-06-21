const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");
const UserSubscription = require("../Model/UserSubscription");
const UserSecurity = require("../Model/UserSecurity");
const ResumeOtp = require("../Model/ResumeOtp");
const { sendResumeOtpEmail } = require("../utils/mailer");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const fontPath = path.join(__dirname, "../assets/Outfit.woff2");
const fontB64 = fs.readFileSync(fontPath).toString("base64");

const esc = (s) => String(s || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

// Helper function to generate PDF from resumeData
const generateResumePdf = async (resumeData) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @font-face {
      font-family: 'Outfit';
      src: url('data:font/woff2;base64,${fontB64}') format('woff2');
    }
    body {
      font-family: 'Outfit', sans-serif;
      margin: 0;
      padding: 0;
      color: #1e293b;
      background-color: #ffffff;
      line-height: 1.5;
    }
    .container {
      display: flex;
      min-height: 297mm; /* Standard A4 height */
      box-sizing: border-box;
    }
    .left-col {
      width: 32%;
      background-color: #0f172a;
      color: #f8fafc;
      padding: 40px 25px;
      box-sizing: border-box;
    }
    .right-col {
      width: 68%;
      padding: 40px 35px;
      box-sizing: border-box;
    }
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #3b82f6;
      margin: 0 auto 30px auto;
      display: block;
    }
    .name-title {
      font-size: 28px;
      font-weight: 850;
      margin: 0 0 5px 0;
      color: #0f172a;
    }
    .left-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 6px;
      margin-top: 30px;
      margin-bottom: 15px;
      color: #3b82f6;
    }
    .right-title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 25px;
      margin-bottom: 18px;
      color: #2563eb;
    }
    .contact-item {
      font-size: 12px;
      margin-bottom: 12px;
      word-break: break-all;
    }
    .skill-tag {
      display: inline-block;
      background-color: #1e293b;
      color: #f1f5f9;
      padding: 4px 8px;
      font-size: 10px;
      font-weight: 600;
      border-radius: 6px;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .summary-text {
      font-size: 13px;
      color: #334155;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .item-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0;
      color: #1e293b;
    }
    .item-subtitle {
      font-size: 12px;
      color: #2563eb;
      font-weight: 600;
      margin-top: 2px;
      margin-bottom: 5px;
    }
    .item-date {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .item-desc {
      font-size: 12.5px;
      color: #475569;
      margin-top: 0;
      margin-bottom: 15px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="left-col">
      ${resumeData.photoUrl ? `<img class="avatar" src="${esc(resumeData.photoUrl)}" alt="Avatar">` : ''}
      
      <div class="left-title">Contact</div>
      <div class="contact-item"><strong>Email:</strong><br>${esc(resumeData.email)}</div>
      <div class="contact-item"><strong>Phone:</strong><br>${esc(resumeData.phone)}</div>
      <div class="contact-item"><strong>Location:</strong><br>${esc(resumeData.location)}</div>
      
      ${resumeData.personalInfo?.skills ? `
        <div class="left-title">Skills</div>
        <div style="margin-top: 10px;">
          ${resumeData.personalInfo.skills.split(',').map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('')}
        </div>
      ` : ''}

      ${resumeData.personalInfo?.hobbies ? `
        <div class="left-title">Hobbies</div>
        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">
          ${esc(resumeData.personalInfo.hobbies)}
        </div>
      ` : ''}
    </div>
    <div class="right-col">
      <h1 class="name-title">${esc(resumeData.name)}</h1>
      <div style="font-size: 12px; color: #64748b; margin-bottom: 25px;">Verified Gold Member of InternArea</div>
      
      ${resumeData.personalInfo?.about ? `
        <div class="right-title" style="margin-top: 0;">Profile Summary</div>
        <div class="summary-text">${esc(resumeData.personalInfo.about)}</div>
      ` : ''}
      
      ${resumeData.experience && resumeData.experience.length > 0 ? `
        <div class="right-title">Experience</div>
        ${resumeData.experience.map(exp => `
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h3 class="item-title">${esc(exp.role)}</h3>
              <span class="item-date">${esc(exp.duration)}</span>
            </div>
            <div class="item-subtitle">${esc(exp.company)}</div>
            <p class="item-desc">${esc(exp.description)}</p>
          </div>
        `).join('')}
      ` : ''}
      
      ${resumeData.qualifications && resumeData.qualifications.length > 0 ? `
        <div class="right-title">Education</div>
        ${resumeData.qualifications.map(edu => `
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h3 class="item-title">${esc(edu.degree)}</h3>
              <span class="item-date">${esc(edu.year)}</span>
            </div>
            <div class="item-subtitle">${esc(edu.school)}</div>
            <p class="item-desc" style="margin-bottom: 0;">Score: ${esc(edu.percentage || edu.cgpa)}</p>
          </div>
        `).join('')}
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdfBuffer;
};

// 1. POST /send-otp — Generate OTP and email it (Gold Users Only)
router.post("/send-otp", authMiddleware, async (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  if (!userEmail) {
    return res.status(400).json({ message: "User email is required." });
  }

  try {
    // Check if user is on Gold plan
    const sub = await UserSubscription.findOne({
      userEmail,
      planName: "Gold",
      expiresAt: { $gt: new Date() }
    });

    if (!sub) {
      return res.status(403).json({ message: "Only users on a Gold subscription plan can build a resume." });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await ResumeOtp.findOneAndUpdate(
      { email: userEmail },
      { otpHash, expiresAt, verified: false, verifiedAt: null },
      { upsert: true, new: true }
    );

    const emailResult = await sendResumeOtpEmail({
      to: userEmail,
      otp
    });

    return res.status(200).json({
      message: "OTP sent to your registered email.",
      developmentOtpPreview: emailResult.developmentOtpPreview || null
    });
  } catch (error) {
    console.error("Error in /send-otp:", error);
    return res.status(500).json({ message: "Unable to process OTP request right now." });
  }
});

// 2. POST /verify-otp — Validate OTP code
router.post("/verify-otp", authMiddleware, async (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  const { otp } = req.body;

  if (!userEmail || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  try {
    const record = await ResumeOtp.findOne({ email: userEmail });

    if (!record) {
      return res.status(404).json({ message: "No OTP session found for this user." });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
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

    record.verified = true;
    record.verifiedAt = new Date();
    await record.save();

    return res.status(200).json({
      message: "OTP verified successfully. You can now proceed to payment."
    });
  } catch (error) {
    console.error("Error in /verify-otp:", error);
    return res.status(500).json({ message: "Unable to verify OTP right now." });
  }
});

// 3. POST /create-order — Create Razorpay order (OTP check required)
router.post("/create-order", authMiddleware, async (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  if (!userEmail) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const otpRecord = await ResumeOtp.findOne({
      email: userEmail,
      verified: true,
      verifiedAt: { $gte: fifteenMinutesAgo }
    });

    if (!otpRecord) {
      return res.status(403).json({ message: "OTP verification required before initiating payment." });
    }

    const options = {
      amount: 5000, // ₹50 in paise
      currency: "INR",
      receipt: `receipt_resume_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    console.error("Error in /create-order:", error);
    return res.status(500).json({ message: "Unable to initiate payment transaction." });
  }
});

// 4. POST /verify-payment — Verify payment signature and compile PDF
router.post("/verify-payment", authMiddleware, async (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    resumeData
  } = req.body;

  if (!userEmail || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !resumeData) {
    return res.status(400).json({ message: "Missing required payment or resume details." });
  }

  try {
    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature."
      });
    }

    // Generate PDF
    const pdfBuffer = await generateResumePdf(resumeData);

    // Upload to Firebase Storage with Fallback
    let downloadUrl = "";
    const filename = `resume_${req.user.uid || 'user'}_${Date.now()}.pdf`;

    try {
      if (admin.getApps().length > 0) {
        const { getStorage } = require("firebase-admin/storage");
        const bucket = getStorage().bucket(
          process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
        );
        const file = bucket.file(`resumes/${filename}`);
        const token = crypto.randomUUID();
        await file.save(pdfBuffer, {
          metadata: {
            contentType: "application/pdf",
            metadata: {
              firebaseStorageDownloadTokens: token
            }
          }
        });
        downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
      } else {
        throw new Error("Firebase Admin app is not initialized.");
      }
    } catch (storageError) {
      console.error("Firebase Storage upload failed:", storageError);
      return res.status(500).json({ message: "Resume generated but storage failed. Please try again." });
    }

    // Update user profile (Subscription model)
    await UserSubscription.findOneAndUpdate(
      { userEmail: userEmail },
      { resumeUrl: downloadUrl }
    );

    // Invalidate the OTP session
    await ResumeOtp.deleteOne({ email: userEmail });

    return res.status(200).json({
      success: true,
      message: "Payment verified and resume PDF generated successfully.",
      resumeUrl: downloadUrl
    });
  } catch (error) {
    console.error("Error in /verify-payment & PDF generation:", error);
    return res.status(500).json({ message: "Unable to process payment verification or generate resume." });
  }
});

module.exports = router;
