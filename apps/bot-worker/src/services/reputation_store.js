
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../_data/reputation.json");

function ensure() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}", "utf8");
}

function load() {
  ensure();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function save(data) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function get(userId) {
  const db = load();
  return db[userId] || 0;
}

function update(userId, delta) {
  const db = load();
  db[userId] = (db[userId] || 0) + delta;
  save(db);
  return db[userId];
}

function all() {
  return load();
}

module.exports = { get, update, all };
