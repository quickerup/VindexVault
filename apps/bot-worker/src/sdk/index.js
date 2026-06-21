const fs = require("fs");
const path = require("path");

const dirName = typeof __dirname !== "undefined" ? __dirname : ".";
const INTEL_PATH = path.join(dirName, "../_data/intelligence.json");
const CHAIN_PATH = path.join(dirName, "../_data/chain_packets.json");

/**
 * SAFE LOADERS
 */
function load(file) {
  try {
    if (fs.existsSync && fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {}
  return [];
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
