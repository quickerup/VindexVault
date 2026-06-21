const fs = require("fs");
const path = require("path");

let memoryDb = {};

const dirName = typeof __dirname !== "undefined" ? __dirname : ".";
const DB_PATH = path.join(dirName, "../_data/reputation.json");

function ensure() {
  try {
    const dir = path.dirname(DB_PATH);
    if (fs.existsSync && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync && !fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}", "utf8");
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
