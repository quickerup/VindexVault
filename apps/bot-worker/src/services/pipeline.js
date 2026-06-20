
const { computeThreatScore } = require("./scoring");
const { createIntelligenceRecord } = require("../types/intelligence");
const store = require("./store");
const { applyReputation } = require("./reputation");
const { issueReward } = require("./rewards");
const { anchorRecord } = require("./anchor");
const { commitToChain } = require("./chain");
const { indexGraph } = require("./graph");

const state = { intelligence: [] };

function createIntelligence(report) {
  const score = computeThreatScore(report);

  let status = "unverified";
  if (score >= 80) status = "high_confidence";
  else if (score >= 50) status = "medium_confidence";
  else status = "low_confidence";

  const record = createIntelligenceRecord({
    report,
    score,
    status
  });

  const rep = applyReputation(report, score);
  const reward = issueReward(report, score, rep);
  const anchor = anchorRecord(record);
  const chain = commitToChain(record, anchor);

  // FIX: pass BOTH objects explicitly
  const graph = indexGraph(record, report);

  const enriched = {
    ...record,
    reputationImpact: rep,
    reward,
    anchor,
    chain,
    graph
  };

  state.intelligence.push(enriched);
  store.append(enriched);

  return enriched;
}

function getIntelligence() {
  return state.intelligence;
}

module.exports = { createIntelligence, getIntelligence };
