
const store = require("./reward_store");

function calculateReward(report, score, reputationImpact) {
  let base = 0;

  // score-based reward
  base += Math.floor(score / 10);

  // reputation multiplier
  const rep = reputationImpact?.reputation || 0;
  base += Math.floor(rep / 5);

  // minimum floor
  if (base < 1) base = 1;

  return base;
}

function issueReward(report, score, reputationImpact) {
  const amount = calculateReward(report, score, reputationImpact);

  const reward = {
    id: "rw_" + Date.now(),
    reportId: report.id,
    userId: report.reporter.id,
    amount,
    createdAt: Date.now()
  };

  return store.add(reward);
}

module.exports = { issueReward };
