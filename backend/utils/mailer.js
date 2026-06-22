const nodemailer = require("nodemailer");

const hasSmtpConfig = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOtpEmail = async ({ to, otp, browser, deviceType, operatingSystem }) => {
  if (!hasSmtpConfig()) {
    console.warn(
      `SMTP is not configured. OTP for ${to}: ${otp}. Configure SMTP_* env vars to send real emails.`
    );
    return {
      delivered: false,
      developmentOtpPreview: otp,
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "InternArea login verification code",
      text: [
        "Your InternArea OTP is:",
        otp,
        "",
        `Browser: ${browser}`,
        `Operating system: ${operatingSystem}`,
        `Device type: ${deviceType}`,
        "",
        "This code expires in 10 minutes.",
      ].join("\n"),
    });
    return { delivered: true };
  } catch (err) {
    console.error(`SMTP network error when sending login OTP to ${to}:`, err.message);
    console.warn(`[FALLBACK] SMTP port might be blocked. OTP for ${to}: ${otp}`);
    return {
      delivered: false,
      developmentOtpPreview: otp,
    };
  }
};

const sendInvoiceEmail = async ({ to, amount, orderId, paymentId, planName }) => {
  if (!hasSmtpConfig()) {
    console.warn(
      `SMTP is not configured. Invoice for ${to} of amount INR ${amount} (${planName || "Standard"} Plan) not sent. Configure SMTP_* env vars to send real emails.`
    );
    return {
      delivered: false,
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "Your Subscription Invoice - InternArea",
      text: [
        "Hello,",
        "",
        "Thank you for choosing InternArea! Here is your payment invoice.",
        "",
        `Plan: ${planName || "Standard"}`,
        `Order ID: ${orderId}`,
        `Payment ID: ${paymentId}`,
        `Amount Paid: INR ${amount}`,
        `Date: ${new Date().toLocaleDateString("en-US")}`,
        "",
        "Welcome to our premium plan!",
        "",
        "Best regards,",
        "InternArea Team",
      ].join("\n"),
    });
    return { delivered: true };
  } catch (err) {
    console.error(`SMTP network error when sending invoice to ${to}:`, err.message);
    return {
      delivered: false,
    };
  }
};

const sendPasswordEmail = async ({ to, newPassword }) => {
  if (!hasSmtpConfig()) {
    console.warn(
      `SMTP not configured. Password reset for ${to} was generated but not delivered. Set SMTP_* env vars.`
    );
    return {
      delivered: false,
      developmentPasswordPreview: newPassword,
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "InternArea Admin Password Reset",
      text: [
        "Hello Admin,",
        "",
        "Your InternArea admin password has been successfully reset.",
        "",
        `Your new password is: ${newPassword}`,
        "",
        "Please log in using this password and change it immediately for security reasons.",
        "",
        "Best regards,",
        "InternArea Team",
      ].join("\n"),
    });
    return { delivered: true };
  } catch (err) {
    console.error(`SMTP network error when resetting password for ${to}:`, err.message);
    console.warn(`[FALLBACK] SMTP port might be blocked. Password for ${to}: ${newPassword}`);
    return {
      delivered: false,
      developmentPasswordPreview: newPassword,
    };
  }
};

const sendResumeOtpEmail = async ({ to, otp }) => {
  if (!hasSmtpConfig()) {
    console.warn(
      `SMTP is not configured. Resume OTP for ${to}: ${otp}. Configure SMTP_* env vars to send real emails.`
    );
    return {
      delivered: false,
      developmentOtpPreview: otp,
    };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "InternArea Resume Builder Verification Code",
      text: [
        "Hello,",
        "",
        "Your verification code for building your resume is:",
        otp,
        "",
        "This code will expire in 10 minutes.",
        "",
        "If you did not request this code, please ignore this email.",
        "",
        "Best regards,",
        "InternArea Team",
      ].join("\n"),
    });
    return { delivered: true };
  } catch (err) {
    console.error(`SMTP network error when sending resume OTP to ${to}:`, err.message);
    console.warn(`[FALLBACK] SMTP port might be blocked. Resume OTP for ${to}: ${otp}`);
    return {
      delivered: false,
      developmentOtpPreview: otp,
    };
  }
};

module.exports = {
  hasSmtpConfig,
  sendOtpEmail,
  sendInvoiceEmail,
  sendPasswordEmail,
  sendResumeOtpEmail,
};
