const getDailyPostingLimit = (friendsCount) => {
  const count = Math.max(0, Number(friendsCount) || 0);
  if (count === 0) return 0;
  if (count > 10) return Infinity;
  return count;
};

module.exports = { getDailyPostingLimit };
