
const assert = require("assert");
const { computeThreatScore } = require("./services/scoring");

const low = computeThreatScore({
  confidence: 0,
  evidence: [],
  suspects: []
});

const high = computeThreatScore({
  confidence: 3,
  evidence: [{}, {}, {}],
  suspects: [{}, {}]
});

assert.ok(low < high, "Scoring broken");
assert.ok(high <= 100, "Overflow");
assert.ok(low >= 0, "Underflow");

console.log("PASS scoring engine v1 (clean reset)");
