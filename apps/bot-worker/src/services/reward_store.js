
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../_data/rewards.json");

function ensure() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]", "utf8");
}

function load() {
  ensure();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function save(data) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function add(reward) {
  const db = load();

  // prevent double-pay (idempotency by reportId)
  if (db.find(r => r.reportId === reward.reportId)) {
    return null;
  }

  db.push(reward);
  save(db);
  return reward;
}

function all() {
  return load();
}

module.exports = { add, all };
