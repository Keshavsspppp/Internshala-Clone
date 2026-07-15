const SUBSCRIPTION_PLANS = Object.freeze({
  Free: Object.freeze({ name: "Free", amountRupees: 0, amountPaise: 0, applicationLimit: 1 }),
  Bronze: Object.freeze({ name: "Bronze", amountRupees: 100, amountPaise: 10000, applicationLimit: 3 }),
  Silver: Object.freeze({ name: "Silver", amountRupees: 300, amountPaise: 30000, applicationLimit: 5 }),
  Gold: Object.freeze({ name: "Gold", amountRupees: 1000, amountPaise: 100000, applicationLimit: Infinity }),
});

const PAID_SUBSCRIPTION_PLANS = Object.values(SUBSCRIPTION_PLANS).filter(
  (plan) => plan.amountPaise > 0
);

const getPaidPlan = ({ planName, amount } = {}) => {
  if (planName && SUBSCRIPTION_PLANS[planName]?.amountPaise > 0) {
    return SUBSCRIPTION_PLANS[planName];
  }

  const amountRupees = Number(amount);
  return PAID_SUBSCRIPTION_PLANS.find(
    (plan) => plan.amountRupees === amountRupees
  );
};

module.exports = {
  SUBSCRIPTION_PLANS,
  PAID_SUBSCRIPTION_PLANS,
  getPaidPlan,
};
