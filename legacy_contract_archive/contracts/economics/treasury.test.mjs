import { validateContract } from '../../scripts/validate-contract.mjs';

validateContract({
  project: 'treasury',
  contract: 'Treasury',
  sourceRel: 'contracts/economics/treasury.tact',
});
