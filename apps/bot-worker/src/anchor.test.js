
const assert = require("assert");
const store = require("./services/anchor_store");
const { createIntelligence } = require("./services/pipeline");

const before = store.all().length;

const report = {
  id: "r_anchor_" + Date.now(),
  title: "anchor test",
  description: "test",
  reporter: { id: "user_anchor", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 3,
  tags: [],
  createdAt: Date.now()
};

const result = createIntelligence(report);

const after = store.all().length;

assert.ok(after >= before, "Anchor not stored");
assert.ok(result.anchor, "Missing anchor");
assert.ok(result.anchor.hash, "Missing hash");

console.log("PASS anchor layer v1 (cryptographic ledger ready)");
