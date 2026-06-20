
const fs = require("fs");
const path = require("path");

const INTEL_PATH = path.join(__dirname, "../_data/intelligence.json");
const CHAIN_PATH = path.join(__dirname, "../_data/chain_packets.json");

/**
 * SAFE LOADERS
 */
function load(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * CORE DATASETS
 */
function getAllIntelligence() {
  return load(INTEL_PATH);
}

function getChainPackets() {
  return load(CHAIN_PATH);
}

/**
 * FILTERS
 */
function getHighConfidenceOnly() {
  return getAllIntelligence().filter(r => r.status === "high_confidence");
}

function getByUser(userId) {
  return getAllIntelligence().filter(r => r.reporter?.id === userId);
}

function getAnchoredOnly() {
  return getAllIntelligence().filter(r => r.anchor?.hash);
}

/**
 * PUBLIC API SURFACE
 */
module.exports = {
  getAllIntelligence,
  getHighConfidenceOnly,
  getByUser,
  getChainPackets,
  getAnchoredOnly
};
