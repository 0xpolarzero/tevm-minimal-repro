// tevm@1.0.0-next.44
// Run with: pnpm ts-node bug-no-revert/index.ts

import { createMemoryClient } from 'tevm';
import { GASLITEDROP_ADDRESS, GASLITEDROP_ABI } from '../constants';

const caller = `0x${'1'.repeat(40)}` as const;
const recipient = `0x${'2'.repeat(40)}` as const;
const amount = BigInt(1e18);
const token = `0x${'3'.repeat(40)}` as const;

const run = async () => {
  // Create client
  const tevm = createMemoryClient({
    fork: {
      url: 'https://mainnet.optimism.io',
    },
  });

  // No matter how absurd the transaction parameters, it will actually not throw any error
  // although it should throw a revert error.
  // Here the token doesn't even exist.
  try {
    const callResult = await tevm.contract({
      caller,
      to: GASLITEDROP_ADDRESS,
      abi: GASLITEDROP_ABI,
      functionName: 'airdropERC20',
      args: [token, [recipient], [amount], amount],
    });

    console.log('Call result:', callResult);
    // ? LOGS:
    // Call result: {
    //   rawData: '0x',
    //   executionGasUsed: 3724n,
    //   selfdestruct: Set(0) {},
    //   gas: 16773491n,
    //   logs: [],
    //   createdAddresses: Set(0) {},
    //   data: undefined
    // }
  } catch (error) {
    // This should be reached
    console.error('Error:', error);
  }
};

run();
