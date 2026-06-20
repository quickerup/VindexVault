import fs from "fs";
import { execSync } from "child_process";

const index = JSON.parse(fs.readFileSync("./boc-index.json", "utf8"));

const deploymentsFile = "./deployments.final.json";

const deployments = fs.existsSync(deploymentsFile)
  ? JSON.parse(fs.readFileSync(deploymentsFile, "utf8"))
  : {};

const receipt = {
  timestamp: Date.now(),
  skipped: [],
  deployed: [],
  reused: []
};

function sha(file) {
  return execSync(`sha256sum ${file} | awk '{print $1}'`, { encoding: "utf8" }).trim();
}

console.log("\n=== SAFE DEPLOY GUARD MODE ===");

for (const [name, file] of Object.entries(index.index)) {

  const localHash = sha(file);
  const prev = deployments[name];

  // CASE 1: already deployed AND unchanged
  if (prev?.hash === localHash && prev?.address) {
    console.log(`✔ REUSE ${name} -> ${prev.address}`);
    receipt.reused.push({ name, address: prev.address });
    continue;
  }

  // CASE 2: exists but changed (redeploy needed)
  if (prev?.address) {
    console.log(`↻ UPDATE ${name} (code changed)`);

  } else {
    console.log(`+ DEPLOY ${name} (new contract)`);
  }

  try {
    const out = execSync(`node scripts/deploy.ts ${name}`, { encoding: "utf8" });

    receipt.deployed.push({ name, output: out });

  } catch (e) {
    console.log(`❌ FAIL ${name}`);
  }
}

fs.writeFileSync(
  "./vindex_safe_deploy_receipt.json",
  JSON.stringify(receipt, null, 2)
);

console.log("\n=== DONE (SAFE MODE) ===");
