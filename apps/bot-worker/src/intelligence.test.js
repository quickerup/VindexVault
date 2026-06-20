
const assert = require("assert");
const { createIntelligence } = require("./services/pipeline");

const result = createIntelligence({
  id: "r_test",
  title: "test report",
  description: "test",
  reporter: { id: "u1", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 0,
  tags: [],
  createdAt: Date.now()
});

assert.ok(result.id, "Missing id");
assert.ok(result.score >= 0 && result.score <= 100, "Invalid score range");
assert.ok(result.status, "Missing status");
assert.ok(Array.isArray(result.suspects), "Invalid schema shape");

console.log("PASS intelligence contract stable");
