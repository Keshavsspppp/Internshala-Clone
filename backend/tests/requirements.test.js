const test = require("node:test");
const assert = require("node:assert/strict");
const { getDailyPostingLimit } = require("../utils/communityLimits");
const {
  getStartOfISTDayUTC,
  getStartOfISTMonthUTC,
  isWithinISTHourWindow,
} = require("../utils/istTime");
const { SUBSCRIPTION_PLANS, getPaidPlan } = require("../utils/subscriptionPlans");
const { issueUserSession, verifyUserSession } = require("../utils/userSession");

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
