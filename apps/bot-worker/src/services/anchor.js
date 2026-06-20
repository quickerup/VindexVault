
const crypto = require("crypto");
const store = require("./anchor_store");

function hashRecord(record) {
  const normalized = JSON.stringify(record, Object.keys(record).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function anchorRecord(record) {
  const hash = hashRecord(record);

  const anchor = {
    id: "an_" + Date.now(),
    recordId: record.id,
    hash,
    createdAt: Date.now()
  };

  return store.add(anchor);
}

module.exports = { anchorRecord };
