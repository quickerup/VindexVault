const fs = require('fs');
const path = require('path');

// js-yaml must be installed globally
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  console.error('js-yaml is not available globally. Run: npm install -g js-yaml');
  process.exit(1);
}

const workflowPath = path.join(__dirname, 'deploy-worker.yml');
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

// Validate the deployment job
const deployJob = jobs['build-and-deploy'];
if (!deployJob) {
  console.error('❌ Missing "build-and-deploy" job.');
  process.exit(1);
}
if (deployJob['runs-on'] !== 'ubuntu-latest') {
  console.error('❌ Job must run on ubuntu-latest.');
  process.exit(1);
}
if (!Array.isArray(deployJob.steps) || deployJob.steps.length === 0) {
  console.error('❌ Job has no steps.');
  process.exit(1);
}

// Check for wrangler deploy step with secret
const deploySteps = deployJob.steps.filter(
  step => step.run && step.run.includes('wrangler deploy')
);
if (deploySteps.length === 0) {
  console.error('❌ No deployment step found (expected "npx wrangler deploy" or similar).');
  process.exit(1);
}

const deployStep = deploySteps[0];
if (!deployStep.env || !deployStep.env.CLOUDFLARE_API_TOKEN) {
  console.error('❌ Deployment step must use CLOUDFLARE_API_TOKEN secret.');
  process.exit(1);
}
if (deployStep.env.CLOUDFLARE_API_TOKEN !== '${{ secrets.CLOUDFLARE_API_TOKEN }}') {
  console.error('❌ CLOUDFLARE_API_TOKEN must be set to ${{ secrets.CLOUDFLARE_API_TOKEN }}');
  process.exit(1);
}

// Simulate GitHub Actions runner environment (best effort)
process.env.GITHUB_WORKSPACE = '/tmp/vindex-vault-mock';
process.env.GITHUB_EVENT_NAME = 'push';
process.env.GITHUB_REF = 'refs/heads/main';

console.log('✅ deploy-worker.yml is valid, deploys with Wrangler, runner env simulated.');
