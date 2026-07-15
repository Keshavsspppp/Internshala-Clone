const UsageQuota = require("../Model/UsageQuota");

const ensureQuota = async ({ key, initialCount, expiresAt }) => {
  try {
    await UsageQuota.create({ _id: key, count: initialCount, expiresAt });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
};

const reserveUsage = async ({ key, limit, initialCount, expiresAt }) => {
  if (limit === Infinity) return { reserved: false, unlimited: true };
  await ensureQuota({ key, initialCount, expiresAt });
  const quota = await UsageQuota.findOneAndUpdate(
    { _id: key, count: { $lt: limit } },
    { $inc: { count: 1 }, $set: { expiresAt } },
    { new: true }
  );
  return quota
    ? { reserved: true, count: quota.count }
    : { reserved: false, limitReached: true };
};

const releaseUsage = ({ key }) =>
  UsageQuota.updateOne({ _id: key, count: { $gt: 0 } }, { $inc: { count: -1 } });

module.exports = { reserveUsage, releaseUsage };
