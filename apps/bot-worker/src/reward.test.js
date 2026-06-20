
const assert = require("assert");
const store = require("./services/reward_store");
const { createIntelligence } = require("./services/pipeline");

const before = store.all().length;

const report = {
  id: "r_reward_" + Date.now(),
  title: "reward test",
  description: "test",
  reporter: { id: "user_reward", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 3,
  tags: [],
  createdAt: Date.now()
};

const result = createIntelligence(report);

const after = store.all().length;

assert.ok(after >= before, "Reward not stored");
assert.ok(result.reward, "Missing reward object");
assert.ok(result.reward.amount > 0, "Invalid reward amount");

console.log("PASS reward system v1 (economic layer active)");
