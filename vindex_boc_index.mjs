import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === "bin") continue;
      walk(full, out);
    }
    else out.push(full);
  }
  return out;
}

console.log("=== FULL FILESYSTEM TRACE (BOC DISCOVERY) ===");

const allFiles = walk(ROOT);
const bocs = allFiles.filter(f => f.endsWith(".boc"));

const index = {};
const duplicates = [];

for (const file of bocs) {
  const base = path.basename(file).replace(".code.boc", "").replace(".boc", "");

  if (!index[base]) {
    index[base] = file;
  } else {
    duplicates.push({ base, existing: index[base], extra: file });
  }
}

console.log("\n=== DISCOVERED BOCS ===");
for (const [k, v] of Object.entries(index)) {
  console.log(`✔ ${k} -> ${v}`);
}

if (duplicates.length) {
  console.log("\n=== DUPLICATES DETECTED ===");
  for (const d of duplicates) {
    console.log(`⚠ ${d.base}`);
    console.log(`   existing: ${d.existing}`);
    console.log(`   extra:    ${d.extra}`);
  }
}

const out = {
  root: ROOT,
  timestamp: Date.now(),
  index,
  duplicates
};

fs.writeFileSync("boc-index.json", JSON.stringify(out, null, 2));

console.log("\n=== SUMMARY ===");
console.log("contracts found:", Object.keys(index).length);
console.log("boc files:", bocs.length);
console.log("duplicates:", duplicates.length);
console.log("\n✔ wrote boc-index.json");
