
const assert = require("assert");
const store = require("./services/store");
const { createIntelligence } = require("./services/pipeline");

// clear in-memory only (file persists across runs)
const before = store.all().length;

const fakeReport = {
  id: "r_persist_" + Date.now(),
  title: "persistent test",
  description: "test",
  reporter: { id: "u1", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 2,
  tags: [],
  createdAt: Date.now()
};

const record = createIntelligence(fakeReport);

const after = store.all().length;

assert.ok(after === before + 1, "Persistence layer failed");
assert.ok(record.id === fakeReport.id, "Record mismatch");

console.log("PASS persistence layer v1 (file-backed ledger)");
