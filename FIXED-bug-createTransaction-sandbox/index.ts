/* -------------------------------------------------------------------------- */
/*                                    FIXED                                   */
/* -------------------------------------------------------------------------- */

// tevm@1.0.0-next.33
// Fixed in tevm@1.0.0-next.37
// Run with: pnpm ts-node bug-createTransaction-sandbox/index.ts
import { createMemoryClient, encodeFunctionData } from 'tevm';
import { MOCKERC20_BYTECODE, MOCKERC20_ABI } from '../constants';

const run = async () => {
  const caller = `0x${'1'.repeat(40)}` as const;
  // Create client
  const tevm = await createMemoryClient({
    fork: {
      url: 'https://mainnet.optimism.io',
    },
  });

  // Set the token contract
  const token = '0x1823FbFF49f731061E8216ad2467112C0469cBFD';
  await tevm.setAccount({
    address: token,
    deployedBytecode: MOCKERC20_BYTECODE,
  });

  const amount = BigInt(1e18);
  // Mint tokens
  const { errors: mintErrors } = await tevm.call({
    caller,
    to: token,
    data: encodeFunctionData({
      abi: MOCKERC20_ABI,
      functionName: 'mint',
      args: [caller, amount],
    }),
    createTransaction: true,
  });
  console.log('Mint errors:', mintErrors ?? 'none');

  // Check balance of caller
  const { rawData: balanceIncluded } = await tevm.call({
    caller,
    to: token,
    data: encodeFunctionData({
      abi: MOCKERC20_ABI,
      functionName: 'balanceOf',
      args: [caller],
    }),
    createTransaction: true,
  });

  console.log(
    'Balance retrieved with createTransaction',
    Number(balanceIncluded.toString()),
  );
  // ? LOGS: 1000000000000000000 (amount, as expected)

  const { rawData: balanceNotIncluded } = await tevm.call({
    caller,
    to: token,
    data: encodeFunctionData({
      abi: MOCKERC20_ABI,
      functionName: 'balanceOf',
      args: [caller],
    }),
    // createTransaction: true,
  });

  console.log(
    'Balance retrieved with no property createTransaction',
    Number(balanceNotIncluded.toString()),
  );
  // ? LOGS: 0 (does not consider the previous calls)
};

run();
