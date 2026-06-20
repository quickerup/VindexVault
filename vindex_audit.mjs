import fs from "fs";
import assert from "assert";
import { execSync } from "child_process";

const contracts = [
  "registry",
  "reputation",
  "reward_engine",
  "staking",
  "treasury",
  "jetton_master"
];

const bocDir = "./artifacts";
const out = {
  timestamp: Date.now(),
  boc: {},
  deployed: {},
  integrity: {}
};

// 1. VERIFY BOC FILES
console.log("\n=== BOC CHECK ===");
for (const c of contracts) {
  const file = `${bocDir}/${c}.code.boc`;
  const exists = fs.existsSync(file);
  out.boc[c] = exists;

  console.log(`${exists ? "✔" : "❌"} ${c} -> ${file}`);
  assert.ok(exists, `Missing BOC: ${c}`);
}

// 2. LOAD DEPLOYMENT FILE IF EXISTS
const depFile = "./apps/contracts/deployments.testnet.json";
if (fs.existsSync(depFile)) {
  const dep = JSON.parse(fs.readFileSync(depFile, "utf8"));
  out.deployed = dep;
  console.log("\n=== DEPLOYMENTS LOADED ===");
  console.log(Object.keys(dep));
} else {
  console.log("\n⚠ No deployments file found");
}

// 3. ON-CHAIN STATE CHECK (toncenter via curl)
console.log("\n=== ON-CHAIN STATE CHECK ===");

function tonGet(address) {
  try {
    const res = execSync(
      `curl -s "https://testnet.toncenter.com/api/v2/getAddressState?address=${address}"`,
      { encoding: "utf8" }
    );
    return JSON.parse(res);
  } catch (e) {
    return { error: e.message };
  }
}

// Only check registry if available
if (out.deployed.registry) {
  const state = tonGet(out.deployed.registry);
  out.integrity.registry = state?.result?.state || "unknown";
  console.log("registry state:", out.integrity.registry);
}

// 4. BASIC SANITY ASSERTIONS
console.log("\n=== INTEGRITY CHECKS ===");

assert.ok(Object.values(out.boc).every(Boolean), "BOC integrity failed");

console.log("✔ All local artifacts present");
console.log("✔ Basic system integrity OK");

// 5. WRITE SNAPSHOT
fs.writeFileSync(
  "./vindex_system_snapshot.json",
  JSON.stringify(out, null, 2)
);

console.log("\n=== SNAPSHOT WRITTEN ===");
console.log("vindex_system_snapshot.json");

