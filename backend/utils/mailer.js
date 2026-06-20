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
};

const sendInvoiceEmail = async ({ to, amount, orderId, paymentId }) => {
  if (!hasSmtpConfig()) {
    console.warn(
      `SMTP is not configured. Invoice for ${to} of amount INR ${amount} not sent. Configure SMTP_* env vars to send real emails.`
    );
    return {
      delivered: false,
    };
  }

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
};

const sendPasswordEmail = async ({ to, newPassword }) => {
  if (!hasSmtpConfig()) {
    console.warn(
      `SMTP is not configured. New password for admin (${to}): ${newPassword}. Configure SMTP_* env vars to send real emails.`
    );
    return {
      delivered: false,
      developmentPasswordPreview: newPassword,
    };
  }

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
};

module.exports = {
  hasSmtpConfig,
  sendOtpEmail,
  sendInvoiceEmail,
  sendPasswordEmail,
};
