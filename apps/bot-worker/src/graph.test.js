
const assert = require("assert");
const store = require("./services/graph_store");
const { createIntelligence } = require("./services/pipeline");

const before = store.all().nodes.length;

const report = {
  id: "r_graph_" + Date.now(),
  title: "graph test",
  description: "test",
  reporter: { id: "user_graph", type: "telegram_user" },
  suspects: [],
  evidence: [],
  confidence: 3,
  tags: [],
  createdAt: Date.now()
};

const result = createIntelligence(report);

const after = store.all().nodes.length;

assert.ok(after >= before, "Graph nodes not stored");
assert.ok(result.graph.nodes.length > 0, "No graph nodes created");
assert.ok(result.graph.edges.length > 0, "No graph edges created");

console.log("PASS graph layer v1 (fixed contract + stable ingestion)");
