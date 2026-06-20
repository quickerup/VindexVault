const fs = require('fs');
const path = require('path');

// js-yaml is expected to be installed globally
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  console.error('js-yaml is not available globally. Run: npm install -g js-yaml');
  process.exit(1);
}

const workflowPath = path.join(__dirname, 'deploy-contracts.yml');
let raw, parsed;

try {
  raw = fs.readFileSync(workflowPath, 'utf8');
} catch (err) {
  console.error('❌ Cannot read workflow file:', err.message);
  process.exit(1);
}

try {
  parsed = yaml.load(raw);
} catch (err) {
  console.error('❌ Invalid YAML syntax:', err.message);
  process.exit(1);
}

// Required top-level keys
const required = ['name', 'on', 'jobs'];
for (const key of required) {
  if (!(key in parsed)) {
    console.error(`❌ Missing required key: "${key}"`);
    process.exit(1);
  }
}

const jobs = parsed.jobs;
if (typeof jobs !== 'object' || Object.keys(jobs).length === 0) {
  console.error('❌ No jobs defined.');
  process.exit(1);
}

// Validate each job structure
for (const [jobName, job] of Object.entries(jobs)) {
  if (!job['runs-on']) {
    console.error(`❌ Job "${jobName}" missing "runs-on".`);
    process.exit(1);
  }
  if (!Array.isArray(job.steps) || job.steps.length === 0) {
    console.error(`❌ Job "${jobName}" has no steps.`);
    process.exit(1);
  }
  job.steps.forEach((step, idx) => {
    if (!step.name) {
      console.error(`❌ Job "${jobName}", step ${idx + 1} missing a name.`);
      process.exit(1);
    }
    if (!step.uses && !step.run) {
      console.error(`❌ Job "${jobName}", step "${step.name}" has neither "uses" nor "run".`);
      process.exit(1);
    }
  });
}

// Check that mainnet is never deployed
const allSteps = Object.values(jobs).flatMap(j => j.steps || []);
for (const step of allSteps) {
  const text = JSON.stringify(step).toLowerCase();
  if (text.includes('mainnet') || text.includes('main-net')) {
    console.error(`❌ Mainnet deployment step detected: "${step.name}"`);
    process.exit(1);
  }
}

// Ensure testnet deployment exists and uses the correct secret
const testnetDeployJob = jobs['deploy-testnet'];
if (!testnetDeployJob) {
  console.error('❌ Missing "deploy-testnet" job.');
  process.exit(1);
}
const deploySteps = testnetDeployJob.steps.filter(
  step => step.run && step.run.includes('blueprint deploy')
);
if (deploySteps.length === 0) {
  console.error('❌ No testnet deployment step (blueprint deploy --testnet) found.');
  process.exit(1);
}
const deployStep = deploySteps[0];
if (!deployStep.env || !deployStep.env.DEPLOYER_MNEMONIC) {
  console.error('❌ Testnet deployment step must use DEPLOYER_MNEMONIC secret.');
  process.exit(1);
}
if (deployStep.env.DEPLOYER_MNEMONIC !== '${{ secrets.TESTNET_DEPLOYER_MNEMONIC }}') {
  console.error('❌ DEPLOYER_MNEMONIC must be set to ${{ secrets.TESTNET_DEPLOYER_MNEMONIC }}');
  process.exit(1);
}

// Simulate GitHub Actions runner environment (best effort)
process.env.GITHUB_WORKSPACE = '/tmp/vindex-vault-mock';
process.env.GITHUB_EVENT_NAME = 'push';
process.env.GITHUB_REF = 'refs/heads/main';

console.log('✅ deploy-contracts.yml is valid, deploys only to testnet, runner env simulated.');
