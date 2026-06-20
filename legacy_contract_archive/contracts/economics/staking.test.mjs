import { validateContract } from '../../scripts/validate-contract.mjs';

validateContract({
  project: 'staking',
  contract: 'Staking',
  sourceRel: 'contracts/economics/staking.tact',
});
