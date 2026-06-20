import { validateContract } from '../../scripts/validate-contract.mjs';

validateContract({
  project: 'reward_engine',
  contract: 'RewardEngine',
  sourceRel: 'contracts/economics/reward_engine.tact',
});
