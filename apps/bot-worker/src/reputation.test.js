
const assert = require("assert");
const rep = require("./services/reputation_store");
const { createIntelligence } = require("./services/pipeline");

// reset simple in-memory assumption (file persists, so we just observe delta)
const before = rep.get("user_test") || 0;

const report = {
  id: "r_rep_" + Date.now(),
  title: "reputation test",
  description: "test",
  reporter: { id: "user_test", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 3,
  tags: [],
  createdAt: Date.now()
};

const result = createIntelligence(report);

const after = rep.get("user_test");

assert.ok(after > before, "Reputation did not increase");
assert.ok(result.reputationImpact, "Missing reputation impact");

console.log("PASS reputation system v1 (persistent scoring)");
