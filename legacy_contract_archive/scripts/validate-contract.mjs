import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

export function validateContract({ project, contract, sourceRel }) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sourcePath = path.join(root, sourceRel);
  const outPath = path.join(root, 'output', `${project}_${contract}.ts`);

  assert.ok(fs.existsSync(sourcePath), `Missing contract source: ${sourceRel}`);

  execFileSync('tact', ['--config', 'tact.config.json', '--project', project], {
    cwd: root,
    stdio: 'inherit',
  });

  assert.ok(fs.existsSync(outPath), `Missing wrapper output: ${path.relative(root, outPath)}`);

  const src = fs.readFileSync(outPath, 'utf8');
  assert.match(src, new RegExp(`export\\s+class\\s+${contract}\\b`), `Missing wrapper class ${contract}`);

  const methods = [...src.matchAll(/^\s+(?:public\s+|private\s+|protected\s+)?(?:async\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm)]
    .map((m) => m[1])
    .filter((name) => name !== 'constructor');

  assert.ok(methods.length >= 2, `Expected at least two methods in ${path.basename(outPath)}`);
  assert.ok(methods.some((name) => name === 'send' || /^send[A-Z]/.test(name)), `Missing send method in ${path.basename(outPath)}`);
  assert.ok(methods.some((name) => /^get[A-Z]/.test(name)), `Missing getter method in ${path.basename(outPath)}`);

  console.log(`PASS ${project}: ${path.basename(outPath)} (${methods.length} methods)`);
}
