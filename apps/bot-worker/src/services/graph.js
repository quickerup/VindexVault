
const store = require("./graph_store");

function extractNodes(record, report) {
  if (!record || !report) {
    throw new Error("Graph index requires record + report");
  }

  return [
    {
      id: record.id,
      type: "report",
      label: record.status || "unknown"
    },
    {
      id: report.reporter?.id,
      type: "actor",
      label: "reporter"
    }
  ];
}

function extractEdges(record, report) {
  return [
    {
      from: report.reporter?.id,
      to: record.id,
      type: "reported"
    }
  ];
}

function indexGraph(record, report) {
  const nodes = extractNodes(record, report);
  const edges = extractEdges(record, report);

  nodes.forEach(n => store.addNode(n));
  edges.forEach(e => store.addEdge(e));

  return { nodes, edges };
}

module.exports = { indexGraph };
