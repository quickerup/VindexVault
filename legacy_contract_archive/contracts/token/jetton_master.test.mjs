import { validateContract } from '../../scripts/validate-contract.mjs';

validateContract({
  project: 'jetton_master',
  contract: 'JettonMaster',
  sourceRel: 'contracts/token/jetton_master.tact',
});
