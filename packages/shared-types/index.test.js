const fs = require('fs');
const assert = require('assert');
const path = require('path');

const file = fs.readFileSync(path.join(__dirname, 'index.ts'), 'utf8');

// Core schema presence checks (no TS runtime dependency)
assert(file.includes('ThreatReport'), 'Missing ThreatReport type');
assert(file.includes('GraphLink'), 'Missing GraphLink type');
assert(file.includes('ReputationScore'), 'Missing ReputationScore type');

assert(file.includes('ActorType'), 'Missing ActorType enum');
assert(file.includes('ConfidenceLevel'), 'Missing ConfidenceLevel enum');

assert(file.includes('evidence'), 'Missing evidence field');
assert(file.includes('suspects'), 'Missing suspects field');

console.log('PASS shared-types: schema integrity verified');
