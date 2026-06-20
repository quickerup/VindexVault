#!/bin/bash
set -e
BASE="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE"
rm -rf output
mkdir -p output
echo "=== Compiling Registry contract ==="
tact --config tact.config.json --project registry
test -f output/registry_Registry.ts || { echo "❌ Compilation failed: missing wrapper"; exit 1; }
echo "✔ Compilation OK"
