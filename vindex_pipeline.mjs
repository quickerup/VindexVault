import fs from "fs";
import { execSync } from "child_process";

const index = JSON.parse(fs.readFileSync("./boc-index.json", "utf8"));

const receipt = {
  timestamp: Date.now(),
  steps: [],
  deployed: {},
  verified: {}
};

function log(step, data) {
  receipt.steps.push({ step, data });
  console.log(`\n=== ${step} ===`);
  console.log(data || "");
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: "pipe" }).toString();
}

// 1. LOAD DEPLOYMENTS (if exist)
let deployments = {};
if (fs.existsSync("./deployments.final.json")) {
  deployments = JSON.parse(fs.readFileSync("./deployments.final.json", "utf8"));
}

// 2. BUILD CHECK
log("BOC INDEX LOADED", Object.keys(index.index).length + " contracts");

// 3. COMPARE + DEPLOY LOOP
for (const [name, bocPath] of Object.entries(index.index)) {

  log(`PROCESSING ${name}`, bocPath);

  const prev = deployments[name];

  // crude but effective hash comparison
  const localHash = execSync(`sha256sum ${bocPath} | awk '{print $1}'`, { encoding: "utf8" }).trim();

  if (prev?.hash === localHash) {
    log(`${name} SKIP`, "no changes detected");
    continue;
  }

  log(`${name} DEPLOY`, "triggering deployment");

  try {
    // NOTE: assumes you already have deploy script wired per contract
    const result = run(`node scripts/deploy.ts ${name}`).toString();

    receipt.deployed[name] = {
      status: "deployed",
      output: result,
      hash: localHash
    };

  } catch (e) {
    receipt.deployed[name] = {
      status: "failed",
      error: e.message
    };
  }
}

// 4. VERIFY ON CHAIN (if addresses exist)
log("ON-CHAIN VERIFICATION", "starting");

if (fs.existsSync("./deployments.final.json")) {
  const dep = JSON.parse(fs.readFileSync("./deployments.final.json", "utf8"));

  for (const [name, info] of Object.entries(dep)) {
    try {
      const res = execSync(
        `curl -s "https://testnet.toncenter.com/api/v2/getAddressState?address=${info.address}"`,
        { encoding: "utf8" }
      );

      receipt.verified[name] = JSON.parse(res);

    } catch (e) {
      receipt.verified[name] = { error: e.message };
    }
  }
}

// 5. WRITE IMMUTABLE RECEIPT
fs.writeFileSync(
  "./vindex_deployment_receipt.json",
  JSON.stringify(receipt, null, 2)
);

console.log("\n=== DONE ===");
console.log("receipt -> vindex_deployment_receipt.json");
