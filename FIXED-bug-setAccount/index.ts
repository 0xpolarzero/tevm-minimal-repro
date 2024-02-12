/* -------------------------------------------------------------------------- */
/*                                    FIXED                                   */
/* -------------------------------------------------------------------------- */

// tevm@1.0.0-next.30
// Run with pnpm ts-node bug-setAccount/index.ts
import { createMemoryClient } from 'tevm';
import { MOCKERC20_BYTECODE } from '../constants';

const run = async () => {
  // Create client
  const tevm = await createMemoryClient({
    fork: {
      url: 'https://mainnet.optimism.io',
    },
  });

  // Use an arbitrary address as the token
  const token = '0x1823FbFF49f731061E8216ad2467112C0469cBFD';
  console.log(
    'code at token before',
    (await tevm.getAccount({ address: token })).deployedBytecode,
  );
  // ? LOGS: 0x00

  // Set the bytecode at this address
  await tevm.setAccount({
    address: token,
    balance: BigInt(0), // remove this as a hack to have it work in this version as well
    deployedBytecode: MOCKERC20_BYTECODE,
  });

  console.log(
    'code at token after',
    (await tevm.getAccount({ address: token })).deployedBytecode,
  );
  // ? LOGS: 0x00
  // It should log the given bytecode instead
};

run();
