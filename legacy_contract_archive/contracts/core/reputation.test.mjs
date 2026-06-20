import { validateContract } from '../../scripts/validate-contract.mjs';

validateContract({
  project: 'reputation',
  contract: 'Reputation',
  sourceRel: 'contracts/core/reputation.tact',
});
