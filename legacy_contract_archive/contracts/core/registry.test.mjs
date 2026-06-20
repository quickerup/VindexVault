import { validateContract } from '../../scripts/validate-contract.mjs';

validateContract({
  project: 'registry',
  contract: 'Registry',
  sourceRel: 'contracts/core/registry.tact',
});
