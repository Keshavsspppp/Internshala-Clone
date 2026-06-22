const nodemailer = require("nodemailer");
const https = require("https");

const postJson = (url, headers, body) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
};

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
    connectionTimeout: 2500, // 2.5 seconds connection timeout
    greetingTimeout: 2500,   // 2.5 seconds greeting timeout
    socketTimeout: 5000,     // 5 seconds socket timeout
  });
};

const sendEmailViaResend = async ({ to, subject, text }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";
  const html = text.replace(/\n/g, "<br/>");
  
  return postJson(
    "https://api.resend.com/emails",
    {
      "Authorization": `Bearer ${apiKey}`
    },
    {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html
    }
  );
};

const sendMailHelper = async ({ to, subject, text }) => {
  if (process.env.RESEND_API_KEY) {
    await sendEmailViaResend({ to, subject, text });
    return { delivered: true };
  }

  if (hasSmtpConfig()) {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    });
    return { delivered: true };
  }

  throw new Error("No email service configured (neither RESEND_API_KEY nor SMTP variables are set)");
};

const sendOtpEmail = async ({ to, otp, browser, deviceType, operatingSystem }) => {
  const text = [
    "Your InternArea OTP is:",
    otp,
    "",
    `Browser: ${browser}`,
    `Operating system: ${operatingSystem}`,
    `Device type: ${deviceType}`,
    "",
    "This code expires in 10 minutes.",
  ].join("\n");

  if (!process.env.RESEND_API_KEY && !hasSmtpConfig()) {
    console.warn(
      `SMTP/Resend not configured. OTP for ${to}: ${otp}. Configure SMTP_* or RESEND_API_KEY env vars to send real emails.`
    );
    return {
      delivered: false,
      developmentOtpPreview: otp,
    };
  }

  try {
    await sendMailHelper({
      to,
      subject: "InternArea login verification code",
      text,
    });
    return { delivered: true };
  } catch (err) {
    console.error(`Email error when sending login OTP to ${to}:`, err.message);
    console.warn(`[FALLBACK] Email delivery failed. OTP for ${to}: ${otp}`);
    return {
      delivered: false,
      developmentOtpPreview: otp,
    };
  }
};

const sendInvoiceEmail = async ({ to, amount, orderId, paymentId, planName }) => {
  const text = [
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
  ].join("\n");

  if (!process.env.RESEND_API_KEY && !hasSmtpConfig()) {
    console.warn(
      `SMTP/Resend not configured. Invoice for ${to} of amount INR ${amount} (${planName || "Standard"} Plan) not sent. Configure env vars.`
    );
    return {
      delivered: false,
    };
  }

  try {
    await sendMailHelper({
      to,
      subject: "Your Subscription Invoice - InternArea",
      text,
    });
    return { delivered: true };
  } catch (err) {
    console.error(`Email error when sending invoice to ${to}:`, err.message);
    return {
      delivered: false,
    };
  }
};

const sendPasswordEmail = async ({ to, newPassword }) => {
  const text = [
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
  ].join("\n");

  if (!process.env.RESEND_API_KEY && !hasSmtpConfig()) {
    console.warn(
      `SMTP/Resend not configured. Password reset for ${to} was generated but not delivered.`
    );
    return {
      delivered: false,
      developmentPasswordPreview: newPassword,
    };
  }

  try {
    await sendMailHelper({
      to,
      subject: "InternArea Admin Password Reset",
      text,
    });
    return { delivered: true };
  } catch (err) {
    console.error(`Email error when resetting password for ${to}:`, err.message);
    console.warn(`[FALLBACK] Email delivery failed. Password for ${to}: ${newPassword}`);
    return {
      delivered: false,
      developmentPasswordPreview: newPassword,
    };
  }
};

const sendResumeOtpEmail = async ({ to, otp }) => {
  const text = [
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
  ].join("\n");

  if (!process.env.RESEND_API_KEY && !hasSmtpConfig()) {
    console.warn(
      `SMTP/Resend not configured. Resume OTP for ${to}: ${otp}.`
    );
    return {
      delivered: false,
      developmentOtpPreview: otp,
    };
  }

  try {
    await sendMailHelper({
      to,
      subject: "InternArea Resume Builder Verification Code",
      text,
    });
    return { delivered: true };
  } catch (err) {
    console.error(`Email error when sending resume OTP to ${to}:`, err.message);
    console.warn(`[FALLBACK] Email delivery failed. Resume OTP for ${to}: ${otp}`);
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
