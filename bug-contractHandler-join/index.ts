// tevm@1.0.0-next.39
// Run with: pnpm ts-node bug-contractHandler-join/index.ts
import { TevmClient, createMemoryClient } from 'tevm';
import { MOCKERC20_BYTECODE, MOCKERC20_ABI } from '../constants';

const caller = `0x${'1'.repeat(40)}` as const;
const recipient = `0x${'2'.repeat(40)}` as const;
const amount = BigInt(1e18);
const token = `0x${'3'.repeat(40)}` as const;

const run = async () => {
  // Create client
  const tevm = await createMemoryClient({
    fork: {
      url: 'https://mainnet.optimism.io',
    },
  });

  // Set the token contract
  await tevm.setAccount({
    address: token,
    deployedBytecode: MOCKERC20_BYTECODE,
  });

  // No matter if the transaction should succeed or fail, it will throw the same error:
  // `TypeError: Cannot read properties of undefined (reading 'join')`
  // at `@tevm/actions/src/tevm/contractHandler.js:37`
  const { errors } = await tevm.contract({
    caller,
    to: token,
    abi: MOCKERC20_ABI,
    // Replace this:
    functionName: 'transfer',
    // ...  with one of these and it should work:
    // functionName: 'mint',
    // functionName: 'approve',
    args: [recipient, amount],
  });

  if (errors) console.log('Errors:', errors);
};

run();
