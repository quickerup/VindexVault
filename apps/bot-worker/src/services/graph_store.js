const fs = require("fs");
const path = require("path");

let memoryDb = { nodes: [], edges: [] };

const dirName = typeof __dirname !== "undefined" ? __dirname : ".";
const DB_PATH = path.join(dirName, "../_data/graph.json");

function ensure() {
  try {
    const dir = path.dirname(DB_PATH);
    if (fs.existsSync && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync && !fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ nodes: [], edges: [] }, null, 2), "utf8");
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

function addNode(node) {
  const db = load();
  if (!db.nodes.find(n => n.id === node.id)) {
    db.nodes.push(node);
  }
  save(db);
  return node;
}

function addEdge(edge) {
  const db = load();
  db.edges.push(edge);
  save(db);
  return edge;
}

function all() {
  return load();
}

module.exports = { addNode, addEdge, all };
