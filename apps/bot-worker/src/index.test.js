
const assert = require("assert");

const { handleCommand } = require("./handlers/commands");
const { getReports, getLinks } = require("./services/indexer");

// reset module cache for clean state
delete require.cache[require.resolve("./services/indexer")];

const r1 = handleCommand("/report phishing fake bot support");
assert.ok(typeof r1.id === "string" && r1.id.startsWith("r_"), "Report ID invalid");

const link = handleCommand("/link walletA walletB");
assert.strictEqual(link, "walletA->walletB");

const reports = getReports();
const links = getLinks();

assert.ok(reports.length >= 1, "Report not stored");
assert.ok(links.length >= 1, "Link not stored");

console.log("PASS bot-worker: ingestion + graph indexing working");
