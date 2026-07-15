const test = require("node:test");
const assert = require("node:assert/strict");
const { getDailyPostingLimit } = require("../utils/communityLimits");
const {
  getStartOfISTDayUTC,
  getStartOfISTMonthUTC,
  isWithinISTHourWindow,
} = require("../utils/istTime");
const {
  PAID_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLANS,
  getPaidPlan,
} = require("../utils/subscriptionPlans");
const { issueUserSession, verifyUserSession } = require("../utils/userSession");
const { generateLetterPassword, isLetterOnlyPassword } = require("../utils/passwordReset");
const { getOtpRetryAfterSeconds } = require("../utils/otpPolicy");
const { isAllowedRemoteImageUrl } = require("../utils/remoteImage");
const { parseAllowedMediaDataUrl } = require("../utils/mediaValidation");
const { isChromeBrowserName, resolveDeviceType } = require("../utils/loginEnvironment");

test("community posting limits match the friend rules", () => {
  assert.equal(getDailyPostingLimit(0), 0);
  assert.equal(getDailyPostingLimit(1), 1);
  assert.equal(getDailyPostingLimit(2), 2);
  assert.equal(getDailyPostingLimit(10), 10);
  assert.equal(getDailyPostingLimit(11), Infinity);
});

test("payment and mobile access windows use IST regardless of server timezone", () => {
  assert.equal(isWithinISTHourWindow(10, 11, new Date("2026-07-15T04:29:59Z")), false);
  assert.equal(isWithinISTHourWindow(10, 11, new Date("2026-07-15T04:30:00Z")), true);
  assert.equal(isWithinISTHourWindow(10, 11, new Date("2026-07-15T05:29:59Z")), true);
  assert.equal(isWithinISTHourWindow(10, 11, new Date("2026-07-15T05:30:00Z")), false);
  assert.equal(isWithinISTHourWindow(10, 13, new Date("2026-07-15T07:29:59Z")), true);
  assert.equal(isWithinISTHourWindow(10, 13, new Date("2026-07-15T07:30:00Z")), false);
});

test("IST day and month boundaries are stored as their correct UTC instants", () => {
  const duringISTDay = new Date("2026-07-15T12:00:00Z");
  assert.equal(getStartOfISTDayUTC(duringISTDay).toISOString(), "2026-07-14T18:30:00.000Z");
  assert.equal(getStartOfISTMonthUTC(duringISTDay).toISOString(), "2026-06-30T18:30:00.000Z");
});

test("subscription plans have the required prices and monthly limits", () => {
  assert.equal(SUBSCRIPTION_PLANS.Free.applicationLimit, 1);
  assert.deepEqual(getPaidPlan({ amount: 100 }), SUBSCRIPTION_PLANS.Bronze);
  assert.deepEqual(getPaidPlan({ amount: 300 }), SUBSCRIPTION_PLANS.Silver);
  assert.deepEqual(getPaidPlan({ amount: 1000 }), SUBSCRIPTION_PLANS.Gold);
  assert.equal(SUBSCRIPTION_PLANS.Gold.applicationLimit, Infinity);
  assert.deepEqual(
    PAID_SUBSCRIPTION_PLANS.map((plan) => plan.name),
    ["Bronze", "Silver", "Gold"]
  );
});

test("generated reset passwords are random letter-only passwords", () => {
  const samples = new Set(Array.from({ length: 20 }, () => generateLetterPassword()));
  assert.equal(samples.size, 20);
  for (const password of samples) {
    assert.equal(password.length, 12);
    assert.equal(isLetterOnlyPassword(password), true);
  }
  assert.equal(isLetterOnlyPassword("Letters123"), false);
  assert.equal(isLetterOnlyPassword("Letters!"), false);
});

test("OTP resend policy enforces a one-minute cooldown", () => {
  const now = new Date("2026-07-15T08:00:00.000Z");
  assert.equal(getOtpRetryAfterSeconds(null, now), 0);
  assert.equal(getOtpRetryAfterSeconds(new Date("2026-07-15T07:59:30.000Z"), now), 30);
  assert.equal(getOtpRetryAfterSeconds(new Date("2026-07-15T07:59:00.000Z"), now), 0);
});

test("desktop and mobile Chrome variants require Chrome security rules", () => {
  assert.equal(isChromeBrowserName("Chrome"), true);
  assert.equal(isChromeBrowserName("Mobile Chrome"), true);
  assert.equal(isChromeBrowserName("Chrome WebView"), true);
  assert.equal(isChromeBrowserName("Firefox"), false);
  assert.equal(resolveDeviceType({ serverDeviceType: "mobile", reportedDeviceType: "desktop" }), "mobile");
  assert.equal(resolveDeviceType({ serverDeviceType: undefined, reportedDeviceType: "laptop" }), "laptop");
});

test("resume images only allow trusted HTTPS storage providers", () => {
  assert.equal(isAllowedRemoteImageUrl("https://res.cloudinary.com/demo/image/upload/photo.jpg"), true);
  assert.equal(isAllowedRemoteImageUrl("https://lh3.googleusercontent.com/photo.jpg"), true);
  assert.equal(isAllowedRemoteImageUrl("http://169.254.169.254/latest/meta-data"), false);
  assert.equal(isAllowedRemoteImageUrl("https://evil.example/photo.jpg"), false);
});

test("community media requires matching supported extensions and MIME types", () => {
  const jpeg = parseAllowedMediaDataUrl({
    name: "photo.jpg",
    dataUrl: "data:image/jpeg;base64,aGVsbG8=",
  });
  assert.equal(jpeg.valid, true);
  assert.equal(jpeg.buffer.toString(), "hello");
  assert.equal(
    parseAllowedMediaDataUrl({ name: "photo.jpg", dataUrl: "data:video/mp4;base64,aGVsbG8=" }).valid,
    false
  );
  assert.equal(
    parseAllowedMediaDataUrl({ name: "payload.svg", dataUrl: "data:image/svg+xml;base64,aGVsbG8=" }).valid,
    false
  );
});

test("verified platform sessions are signed and identity-bound", () => {
  const originalSecret = process.env.USER_SESSION_JWT_SECRET;
  process.env.USER_SESSION_JWT_SECRET = "test-user-session-secret";
  try {
    const token = issueUserSession({
      uid: "firebase-user-1",
      email: "Student@Example.com",
      attemptId: "attempt-1",
    });
    const session = verifyUserSession(token);
    assert.equal(session.uid, "firebase-user-1");
    assert.equal(session.email, "student@example.com");
    assert.equal(session.purpose, "verified-user-session");
    assert.equal(session.attemptId, "attempt-1");
  } finally {
    if (originalSecret === undefined) delete process.env.USER_SESSION_JWT_SECRET;
    else process.env.USER_SESSION_JWT_SECRET = originalSecret;
  }
});
