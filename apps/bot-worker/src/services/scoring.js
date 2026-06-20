
const { ConfidenceLevel } = require("../_vendor/shared-types");

function computeThreatScore(report) {
  let score = 0;

  const weights = {
    0: 10,
    1: 25,
    2: 50,
    3: 80
  };

  score += weights[report.confidence] || 0;
  score += (report.evidence?.length || 0) * 10;
  score += (report.suspects?.length || 0) * 5;

  return Math.max(0, Math.min(100, score));
}

module.exports = { computeThreatScore };
