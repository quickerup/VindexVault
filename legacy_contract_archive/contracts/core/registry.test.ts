import * as path from 'path';
import * as fs from 'fs';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';

const wrapperPath = path.resolve(__dirname, '../../output/registry_Registry.ts');

describe('Registry contract', () => {
  let blockchain: Blockchain;
  let owner: SandboxContract<TreasuryContract>;
  let registry: any;

  beforeAll(async () => {
    if (!fs.existsSync(wrapperPath)) throw new Error('Wrapper not found – run tact first');
    const wrapperModule = await import(wrapperPath);
    const Registry = wrapperModule.Registry;

    blockchain = await Blockchain.create();
    owner = await blockchain.treasury('owner');

    registry = blockchain.openContract(
      Registry.createFromConfig({ owner: owner.address })
    );
    await registry.sendDeploy(owner.getSender(), toNano('0.1'));
  });

  it('sets and retrieves a Merkle root', async () => {
    const id = 1n;
    const root = 0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefn;
    await registry.send(owner.getSender(), { value: toNano('0.1') }, {
      $$type: 'Update', id, root,
    });
    expect(await registry.getGetRoot(id)).toEqual(root);
  });

  it('rejects non-owner update', async () => {
    const attacker = await blockchain.treasury('attacker');
    await expect(
      registry.send(attacker.getSender(), { value: toNano('0.1') }, {
        $$type: 'Update', id: 2n, root: 123n,
      })
    ).rejects.toThrow();
  });

  it('keeps gas below 0.05 TON', async () => {
    const result = await registry.send(owner.getSender(), { value: toNano('0.1') }, {
      $$type: 'Update', id: 3n, root: 0xdeadbeefn,
    });
    const totalFees = result.transactions.reduce((sum: bigint, tx: any) => sum + tx.totalFees.coins, 0n);
    expect(totalFees).toBeLessThan(toNano('0.05'));
  });
});
