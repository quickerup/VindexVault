/**
 * VindexVault Canonical Threat Intelligence Contract
 * Enhanced Intelligence Record v2
 */

function createIntelligenceRecord({ report, score, status }) {
  return {
    id: report.id,
    title: report.title,
    description: report.description,
    reporter: report.reporter,

    suspects: report.suspects || [],
    evidence: report.evidence || [],
    tags: report.tags || [],

    // structured indicators
    wallets: report.wallets || [],
    telegrams: report.telegrams || [],
    domains: report.domains || [],
    urls: report.urls || [],
    contracts: report.contracts || [],
    hashes: report.hashes || [],

    confidence: report.confidence,
    createdAt: report.createdAt,

    // derived fields
    score,
    status,

    intelligenceVersion: 2
  };
}

module.exports = { createIntelligenceRecord };
