
const store = require("./reputation_store");

function applyReputation(report, score) {
  const userId = report.reporter.id;

  let delta = 0;

  // base contribution
  delta += 1;

  // quality scaling
  if (score >= 80) delta += 5;
  else if (score >= 50) delta += 3;
  else if (score >= 25) delta += 1;
  else delta -= 1;

  const newScore = store.update(userId, delta);

  return {
    userId,
    delta,
    reputation: newScore
  };
}

module.exports = { applyReputation };
