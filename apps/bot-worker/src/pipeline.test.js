
const assert = require("assert");
const { handleCommand } = require("./handlers/commands");
const { getIntelligence } = require("./services/pipeline");

const result = handleCommand("/report fake phishing telegram support bot");

assert.ok(result.id.startsWith("r_"), "No intelligence record created");
assert.ok(typeof result.score === "number", "No score computed");
assert.ok(result.status, "No status assigned");

const all = getIntelligence();
assert.ok(all.length >= 1, "Pipeline not storing records");

console.log("PASS full pipeline wired (ingestion → scoring → intelligence)");
