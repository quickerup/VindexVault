import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { execFileSync } from 'child_process';

const root = process.cwd();
const configPath = path.join(root, 'tact.config.json');
const sourcePath = path.join(root, 'contracts', 'core', 'registry.tact');
const outPath = path.join(root, 'output', 'registry_Registry.ts');

assert.ok(fs.existsSync(configPath), `Missing config: ${configPath}`);
assert.ok(fs.existsSync(sourcePath), `Missing contract: ${sourcePath}`);

execFileSync('tact', ['--config', 'tact.config.json', '--project', 'registry'], {
  cwd: root,
  stdio: 'inherit',
});

assert.ok(fs.existsSync(outPath), `Missing wrapper output: ${outPath}`);

const source = fs.readFileSync(outPath, 'utf8');
assert.match(source, /export\s+class\s+Registry\b/, 'Wrapper class Registry not found');

const methods = [...source.matchAll(/^\s+(?:public\s+|private\s+|protected\s+)?(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm)]
  .map((m) => m[1])
  .filter((name) => name !== 'constructor');

assert.ok(methods.length > 0, 'No methods found in generated wrapper');
assert.ok(
  methods.some((name) => /^(send|get|deploy|init|receive)/i.test(name)),
  `No expected wrapper-style methods found: ${methods.join(', ')}`
);

console.log(`PASS registry: ${path.basename(outPath)} (${methods.length} methods)`);
