import * as path from 'path';
import * as fs from 'fs';
import { Blockchain, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';

const wrapperPath = path.resolve(__dirname, '../output/registry_Registry.ts');

if (!fs.existsSync(wrapperPath)) {
  throw new Error('Missing compiled contract wrapper. Run build first.');
}

let Registry: any;

describe('Registry contract', () => {
  let blockchain: any;
  let owner: any;
  let registry: any;

  beforeAll(async () => {
    const registryModule = await import(wrapperPath);
    Registry = registryModule.Registry;

    blockchain = await Blockchain.create();
    owner = await blockchain.treasury('owner');

    registry = blockchain.openContract(
      await Registry.fromInit(owner.address)
    );
    await registry.send(owner.getSender(), { value: toNano('0.1') }, {
      $$type: 'Deploy', queryId: 0n,
    });
  });

  it('stores and retrieves a Merkle root', async () => {
    const id = 1n;
    const root = 0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdn;
    await registry.send(owner.getSender(), { value: toNano('0.1') }, {
      $$type: 'Update', id, root,
    });
    expect(await registry.getGetRoot(id)).toEqual(root);
  });

  it('rejects non-owner update', async () => {
    const attacker = await blockchain.treasury('attacker');
    const result = await registry.send(attacker.getSender(), { value: toNano('0.1') }, {
      $$type: 'Update', id: 2n, root: 123n,
    });
    const hasFailed = result.transactions.some(
      (tx: any) => tx.description?.computePhase?.type === 'vm' && tx.description.computePhase.exitCode !== 0
    );
    expect(hasFailed).toBe(true);
  });

  it('keeps gas below 0.05 TON', async () => {
    const result = await registry.send(owner.getSender(), { value: toNano('0.1') }, {
      $$type: 'Update', id: 3n, root: 0xdeadbeefn,
    });
    const totalFees = result.transactions.reduce((sum: bigint, tx: any) => sum + tx.totalFees.coins, 0n);
    expect(totalFees).toBeLessThan(toNano('0.05'));
  });
});
