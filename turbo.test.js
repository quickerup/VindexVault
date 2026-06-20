const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'turbo.json');

let config;
try {
  const raw = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(raw);
} catch (err) {
  console.error('❌ turbo.json is invalid JSON:', err.message);
  process.exit(1);
}

// Required top-level keys
if (!config.tasks) {
  console.error('❌ Missing "tasks" property.');
  process.exit(1);
}

const tasks = config.tasks;

// Must have build and compile tasks
if (!tasks.build) {
  console.error('❌ Missing "build" task.');
  process.exit(1);
}
if (!tasks.compile) {
  console.error('❌ Missing "compile" task.');
  process.exit(1);
}

// 1. Contracts compile cache disabled → prevents stale artifacts
if (tasks.compile.cache !== false) {
  console.error('❌ "compile" task must set "cache": false to avoid serving stale contract artifacts.');
  process.exit(1);
}

// 2. Compile outputs must be declared for downstream cache‑busting
if (!Array.isArray(tasks.compile.outputs) || tasks.compile.outputs.length === 0) {
  console.error('❌ "compile" task must define outputs for dependency tracking.');
  process.exit(1);
}

// 3. Worker build must depend on compile (^compile) to ensure fresh contracts
const buildDeps = tasks.build.dependsOn || [];
if (!buildDeps.includes('^compile')) {
  console.error('❌ "build" task must depend on "^compile" to guarantee fresh contract artifacts.');
  process.exit(1);
}

// 4. Deploy task depends on both (extra check)
if (!tasks.deploy || !tasks.deploy.dependsOn || (!tasks.deploy.dependsOn.includes('build') && !tasks.deploy.dependsOn.includes('compile'))) {
  console.warn('⚠ "deploy" task missing dependencies on build/compile – ensure it is configured correctly.');
}

console.log('✅ turbo.json is valid and addresses caching issues: compile cache disabled, build depends on compile.');
