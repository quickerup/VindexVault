
const store = require("./chain_store");

/**
 * Convert anchor → registry payload
 * (simulated TON message structure)
 */
function buildChainPacket(record, anchor) {
  return {
    op: "REGISTER_INTEL",
    payload: {
      recordId: record.id,
      hash: anchor.hash,
      timestamp: Date.now(),
      confidence: record.status,
      score: record.score
    }
  };
}

function commitToChain(record, anchor) {
  const packet = buildChainPacket(record, anchor);

  const stored = store.add({
    id: "cp_" + Date.now(),
    recordId: record.id,
    packet,
    createdAt: Date.now()
  });

  return stored;
}

module.exports = { commitToChain };
