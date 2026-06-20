
const assert = require("assert");
const sdk = require("./sdk/index");
const { createIntelligence } = require("./services/pipeline");

const report = {
  id: "r_sdk_" + Date.now(),
  title: "sdk test",
  description: "test",
  reporter: { id: "user_sdk", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 3,
  tags: [],
  createdAt: Date.now()
};

createIntelligence(report);

const all = sdk.getAllIntelligence();
const byUser = sdk.getByUser("user_sdk");
const anchored = sdk.getAnchoredOnly();
const chains = sdk.getChainPackets();

assert.ok(all.length > 0, "SDK failed to load intelligence");
assert.ok(byUser.length > 0, "User filter broken");
assert.ok(Array.isArray(chains), "Chain packets invalid");
assert.ok(Array.isArray(anchored), "Anchored filter invalid");

console.log("PASS SDK v1 (public intelligence API stable)");
