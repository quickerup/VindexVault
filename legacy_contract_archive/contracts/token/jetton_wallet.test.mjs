import { validateContract } from '../../scripts/validate-contract.mjs';

validateContract({
  project: 'jetton_wallet',
  contract: 'JettonWallet',
  sourceRel: 'contracts/token/jetton_wallet.tact',
});
