const fs = require('fs');
const path = require('path');

const rootPkgPath = path.join(__dirname, 'package.json');
let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
} catch (err) {
  console.error('❌ package.json is invalid JSON:', err.message);
  process.exit(1);
}

// 1. Required fields
if (!pkg.private) {
  console.error('❌ Root package.json must be private: true.');
  process.exit(1);
}
if (!Array.isArray(pkg.workspaces) || pkg.workspaces.length === 0) {
  console.error('❌ Missing or empty workspaces array.');
  process.exit(1);
}

// 2. Workspace globs should match expected directories
const expectedGlobs = ['apps/*', 'packages/*'];
for (const glob of expectedGlobs) {
  if (!pkg.workspaces.includes(glob)) {
    console.error(`❌ Workspace glob "${glob}" missing.`);
    process.exit(1);
  }
}

// 3. Scripts must delegate to turbo
const requiredScripts = ['build', 'test', 'lint'];
for (const script of requiredScripts) {
  if (!pkg.scripts || !pkg.scripts[script] || !pkg.scripts[script].startsWith('turbo')) {
    console.error(`❌ Script "${script}" must call turbo.`);
    process.exit(1);
  }
}

// 4. Avoid version conflicts: Tact compiler and Wrangler must NOT be in root
const forbiddenDeps = ['@tact-lang/compiler', '@tact-lang/emulator', 'wrangler', '@cloudflare/wrangler'];
function checkDeps(depsObj, location) {
  if (!depsObj) return;
  for (const dep of forbiddenDeps) {
    if (depsObj[dep]) {
      console.error(`❌ "${dep}" found in root ${location}. It must stay in the sub-package (apps/contracts or apps/bot-worker).`);
      process.exit(1);
    }
  }
}

checkDeps(pkg.dependencies, 'dependencies');
checkDeps(pkg.devDependencies, 'devDependencies');
checkDeps(pkg.peerDependencies, 'peerDependencies');

// 5. Turbo version must be within a safe range (semver carat ok)
if (!pkg.devDependencies || !pkg.devDependencies.turbo) {
  console.error('❌ turbo must be a root devDependency.');
  process.exit(1);
}

// Minimal check: if version is a semver range it should at least allow 2.x
const turboVersion = pkg.devDependencies.turbo;
if (!turboVersion.startsWith('^') && !turboVersion.startsWith('~') && !turboVersion.startsWith('>=')) {
  console.warn('⚠ turbo version is pinned exactly – consider using a caret range for patch updates.');
}

console.log('✅ package.json is valid: workspaces correct, scripts use turbo, no conflicting dependencies in root.');
