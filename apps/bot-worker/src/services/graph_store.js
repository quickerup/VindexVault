
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../_data/graph.json");

function ensure() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ nodes: [], edges: [] }, null, 2), "utf8");
}

function load() {
  ensure();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function save(data) {
  ensure();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
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
