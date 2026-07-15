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
const PaymentTransaction = require("../Model/PaymentTransaction");
const { sendResumeOtpEmail } = require("../utils/mailer");
const { verifiedAuthMiddleware: authMiddleware } = require("../middleware/auth");
const { claimPayment, completePayment, failPayment } = require("../utils/paymentTransactions");
const { getOtpRetryAfterSeconds } = require("../utils/otpPolicy");
const { isAllowedRemoteImageUrl } = require("../utils/remoteImage");
const { PAID_SUBSCRIPTION_PLANS } = require("../utils/subscriptionPlans");

const router = express.Router();
const RESUME_PRICE_PAISE = 5000;
const PREMIUM_RESUME_PLANS = PAID_SUBSCRIPTION_PLANS.map((plan) => plan.name);

const signaturesMatch = (generated, received) => {
  const generatedBuffer = Buffer.from(String(generated), "utf8");
  const receivedBuffer = Buffer.from(String(received), "utf8");
  return generatedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
};

const findActivePremiumSubscription = (userEmail) =>
  UserSubscription.findOne({
    userEmail,
    planName: { $in: PREMIUM_RESUME_PLANS },
    expiresAt: { $gt: new Date() },
  });

let razorpayClient = null;
const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

const fontPath = path.join(__dirname, "../assets/Outfit.woff2");
let fontB64 = "";
try {
  fontB64 = fs.readFileSync(fontPath).toString("base64");
} catch (e) {
  console.warn("Outfit.woff2 not found — PDF will use system fonts as fallback");
}

const esc = (s) => String(s || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const RESUME_PDF_COPY = {
  en: { contact: "Contact", email: "Email", phone: "Phone", location: "Location", skills: "Skills", hobbies: "Hobbies", verified: "Verified {{plan}} Member of InternArea", summary: "Profile Summary", experience: "Experience", education: "Education", score: "Score" },
  es: { contact: "Contacto", email: "Correo", phone: "Teléfono", location: "Ubicación", skills: "Habilidades", hobbies: "Aficiones", verified: "Miembro {{plan}} verificado de InternArea", summary: "Resumen profesional", experience: "Experiencia", education: "Educación", score: "Calificación" },
  hi: { contact: "संपर्क", email: "ईमेल", phone: "फ़ोन", location: "स्थान", skills: "कौशल", hobbies: "रुचियाँ", verified: "InternArea के सत्यापित {{plan}} सदस्य", summary: "प्रोफ़ाइल सारांश", experience: "अनुभव", education: "शिक्षा", score: "अंक" },
  pt: { contact: "Contato", email: "E-mail", phone: "Telefone", location: "Localização", skills: "Competências", hobbies: "Interesses", verified: "Membro {{plan}} verificado do InternArea", summary: "Resumo profissional", experience: "Experiência", education: "Educação", score: "Nota" },
  zh: { contact: "联系方式", email: "电子邮箱", phone: "电话", location: "所在地", skills: "技能", hobbies: "爱好", verified: "InternArea 已验证 {{plan}} 会员", summary: "个人简介", experience: "工作经历", education: "教育经历", score: "成绩" },
  fr: { contact: "Coordonnées", email: "E-mail", phone: "Téléphone", location: "Localisation", skills: "Compétences", hobbies: "Loisirs", verified: "Membre {{plan}} vérifié d’InternArea", summary: "Profil professionnel", experience: "Expérience", education: "Formation", score: "Résultat" },
};

// Helper function to generate PDF from resumeData
const generateResumePdf = async (resumeData, planName) => {
  const locale = Object.prototype.hasOwnProperty.call(RESUME_PDF_COPY, resumeData.locale)
    ? resumeData.locale
    : "en";
  const copy = RESUME_PDF_COPY[locale];
  const verifiedMember = copy.verified.replace("{{plan}}", esc(planName));
  const safePhotoUrl = isAllowedRemoteImageUrl(resumeData.photoUrl) ? resumeData.photoUrl : "";
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @font-face {
      font-family: 'Outfit';
      ${fontB64 ? `src: url('data:font/woff2;base64,${fontB64}') format('woff2');` : ""}
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
      ${safePhotoUrl ? `<img class="avatar" src="${esc(safePhotoUrl)}" alt="Avatar">` : ''}
      
      <div class="left-title">${copy.contact}</div>
      <div class="contact-item"><strong>${copy.email}:</strong><br>${esc(resumeData.email)}</div>
      <div class="contact-item"><strong>${copy.phone}:</strong><br>${esc(resumeData.phone)}</div>
      <div class="contact-item"><strong>${copy.location}:</strong><br>${esc(resumeData.location)}</div>
      
      ${resumeData.personalInfo?.skills ? `
        <div class="left-title">${copy.skills}</div>
        <div style="margin-top: 10px;">
          ${resumeData.personalInfo.skills.split(',').map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('')}
        </div>
      ` : ''}

      ${resumeData.personalInfo?.hobbies ? `
        <div class="left-title">${copy.hobbies}</div>
        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.6;">
          ${esc(resumeData.personalInfo.hobbies)}
        </div>
      ` : ''}
    </div>
    <div class="right-col">
      <h1 class="name-title">${esc(resumeData.name)}</h1>
      <div style="font-size: 12px; color: #64748b; margin-bottom: 25px;">${verifiedMember}</div>
      
      ${resumeData.personalInfo?.about ? `
        <div class="right-title" style="margin-top: 0;">${copy.summary}</div>
        <div class="summary-text">${esc(resumeData.personalInfo.about)}</div>
      ` : ''}
      
      ${resumeData.experience && resumeData.experience.length > 0 ? `
        <div class="right-title">${copy.experience}</div>
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
        <div class="right-title">${copy.education}</div>
        ${resumeData.qualifications.map(edu => `
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h3 class="item-title">${esc(edu.degree)}</h3>
              <span class="item-date">${esc(edu.year)}</span>
            </div>
            <div class="item-subtitle">${esc(edu.school)}</div>
            <p class="item-desc" style="margin-bottom: 0;">${copy.score}: ${esc(edu.percentage || edu.cgpa)}</p>
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
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    return await page.pdf({ format: "A4", printBackground: true });
  } finally {
    await browser.close();
  }
};

// 1. POST /send-otp — Generate OTP and email it (Gold Users Only)
router.post("/send-otp", authMiddleware, async (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  if (!userEmail) {
    return res.status(400).json({ message: "User email is required." });
  }

  try {
    // Any active paid subscription is a premium plan for resume creation.
    const sub = await findActivePremiumSubscription(userEmail);

    if (!sub) {
      return res.status(403).json({ message: "Only users on a paid subscription plan can build a resume." });
    }

    const existingOtp = await ResumeOtp.findOne({ email: userEmail }).lean();
    const retryAfterSeconds = getOtpRetryAfterSeconds(existingOtp?.lastSentAt);
    if (retryAfterSeconds > 0) {
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        retryAfterSeconds,
        message: `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await ResumeOtp.findOneAndUpdate(
      { email: userEmail },
      { otpHash, expiresAt, verified: false, verifiedAt: null, failedAttempts: 0, lastSentAt: new Date() },
      { upsert: true, new: true }
    );

    const emailResult = await sendResumeOtpEmail({
      to: userEmail,
      otp
    });

    if (!emailResult.delivered && !emailResult.developmentOtpPreview) {
      await ResumeOtp.deleteOne({ email: userEmail });
      return res.status(503).json({ message: "The verification email could not be delivered. Please try again later." });
    }

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
    const sub = await findActivePremiumSubscription(userEmail);
    if (!sub) {
      return res.status(403).json({ message: "An active paid subscription plan is required." });
    }

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
      amount: RESUME_PRICE_PAISE, // ₹50 in paise
      currency: "INR",
      receipt: `receipt_resume_${Date.now()}`,
      notes: {
        purpose: "resume",
        userEmail,
      },
    };

    const order = await getRazorpayClient().orders.create(options);
    return res.status(200).json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
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

  let claimedTransaction = null;
  try {
    // Verify payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (!signaturesMatch(generatedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature."
      });
    }

    const razorpay = getRazorpayClient();
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(razorpay_order_id),
      razorpay.payments.fetch(razorpay_payment_id),
    ]);
    const orderEmail = String(order.notes?.userEmail || "").trim().toLowerCase();
    if (
      order.notes?.purpose !== "resume" ||
      orderEmail !== userEmail ||
      Number(order.amount) !== RESUME_PRICE_PAISE ||
      order.currency !== "INR" ||
      payment.order_id !== razorpay_order_id ||
      Number(payment.amount) !== RESUME_PRICE_PAISE ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match the ₹50 resume order."
      });
    }

    // A successfully completed payment remains safely replayable after its
    // one-time OTP has been consumed (for example, after a lost HTTP response).
    const completedTransaction = await PaymentTransaction.findOne({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      purpose: "resume",
      userEmail,
      amountPaise: RESUME_PRICE_PAISE,
      status: "complete",
    });
    if (completedTransaction) {
      return res.status(200).json(completedTransaction.result);
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [sub, otpRecord] = await Promise.all([
      findActivePremiumSubscription(userEmail),
      ResumeOtp.findOne({
        email: userEmail,
        verified: true,
        verifiedAt: { $gte: fifteenMinutesAgo },
      }),
    ]);
    if (!sub || !otpRecord) {
      return res.status(403).json({
        message: "A current premium plan and recent OTP verification are required."
      });
    }

    const claim = await claimPayment({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      purpose: "resume",
      userEmail,
      amountPaise: RESUME_PRICE_PAISE,
    });
    if (claim.complete) return res.status(200).json(claim.transaction.result);
    if (claim.conflict) return res.status(409).json({ success: false, message: "Payment was already used for another purchase." });
    if (claim.processing) return res.status(409).json({ success: false, message: "Payment is already being processed." });
    claimedTransaction = claim.transaction;

    resumeData.email = userEmail;

    // Generate PDF
    const pdfBuffer = await generateResumePdf(resumeData, sub.planName);

    // Upload to Firebase Storage with Fallback
    let downloadUrl = "";
    const filename = `resume_${req.user.uid || 'user'}_${Date.now()}.pdf`;

    try {
      if (admin.getApps().length > 0) {
        const { getStorage } = require("firebase-admin/storage");
        const bucket = getStorage().bucket(
          process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
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

      // Fallback locally in development mode to make local testing easier without Firebase credentials
      if (process.env.NODE_ENV !== "production") {
        console.warn("Development mode: Falling back to local storage for generated resume PDF.");
        const fs = require("fs");
        const path = require("path");
        const resumesDir = path.join(__dirname, "../public/resumes");

        // Ensure resumes directory exists
        if (!fs.existsSync(resumesDir)) {
          fs.mkdirSync(resumesDir, { recursive: true });
        }

        const localPath = path.join(resumesDir, filename);
        fs.writeFileSync(localPath, pdfBuffer);

        // Construct local URL using request protocol and host
        downloadUrl = `${req.protocol}://${req.get("host")}/resumes/${filename}`;
        console.log(`Local fallback resume URL: ${downloadUrl}`);
      } else {
        throw new Error(`Resume storage failed: ${storageError.message}`);
      }
    }

    // Update user profile (Subscription model)
    await UserSubscription.findOneAndUpdate(
      { userEmail: userEmail },
      { resumeUrl: downloadUrl }
    );

    const result = {
      success: true,
      message: "Payment verified and resume PDF generated successfully.",
      resumeUrl: downloadUrl
    };
    await completePayment(claimedTransaction, result);
    claimedTransaction = null;

    // Payment completion is the durable boundary. OTP cleanup is best-effort
    // so a transient database error cannot turn a completed purchase into a retry loop.
    await ResumeOtp.deleteOne({ email: userEmail }).catch((error) => {
      console.error("Unable to clean up completed resume OTP:", error);
    });
    return res.status(200).json(result);
  } catch (error) {
    await failPayment(claimedTransaction, error);
    console.error("Error in /verify-payment & PDF generation:", error);
    return res.status(500).json({ message: "Unable to process payment verification or generate resume." });
  }
});

module.exports = router;
