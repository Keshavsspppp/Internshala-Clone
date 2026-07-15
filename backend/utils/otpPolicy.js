const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

const getOtpRetryAfterSeconds = (lastSentAt, now = new Date()) => {
  if (!lastSentAt) return 0;
  const elapsed = now.getTime() - new Date(lastSentAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed >= OTP_RESEND_COOLDOWN_MS) return 0;
  return Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000));
};

module.exports = { OTP_RESEND_COOLDOWN_MS, getOtpRetryAfterSeconds };
