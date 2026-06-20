import { validateContract } from '../scripts/validate-contract.mjs';

validateContract({
  project: 'messages',
  contract: 'Messages',
  sourceRel: 'contracts/messages.tact',
});
