const fs = require("fs");
const path = require("path");

let memoryDb = [];

const dirName = typeof __dirname !== "undefined" ? __dirname : ".";
const DB_PATH = path.join(dirName, "../_data/rewards.json");

function ensure() {
  try {
    const dir = path.dirname(DB_PATH);
    if (fs.existsSync && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync && !fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]", "utf8");
  } catch (e) {}
}

function load() {
  ensure();
  try {
    if (fs.readFileSync) {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    }
  } catch (e) {}
  return memoryDb;
}

function save(data) {
  ensure();
  try {
    if (fs.writeFileSync) {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
      return;
    }
  } catch (e) {}
  memoryDb = data;
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
