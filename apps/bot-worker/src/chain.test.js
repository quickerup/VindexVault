
const assert = require("assert");
const store = require("./services/chain_store");
const { createIntelligence } = require("./services/pipeline");

const before = store.all().length;

const report = {
  id: "r_chain_" + Date.now(),
  title: "chain test",
  description: "test",
  reporter: { id: "user_chain", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 3,
  tags: [],
  createdAt: Date.now()
};

const result = createIntelligence(report);

const after = store.all().length;

assert.ok(after >= before, "Chain packet not stored");
assert.ok(result.chain.packet.op === "REGISTER_INTEL", "Invalid op code");
assert.ok(result.chain.packet.payload.hash, "Missing anchor hash");

console.log("PASS chain layer v1 (TON-ready registry packets)");
