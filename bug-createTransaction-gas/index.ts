// tevm@1.0.0-next.39
// Run with: pnpm ts-node bug-createTransaction-gas/index.ts
import { TevmClient, createMemoryClient } from 'tevm';
import {
  GASLITEDROP_ADDRESS,
  GASLITEDROP_ABI,
  MOCKERC20_BYTECODE,
  MOCKERC20_ABI,
} from '../constants';

/* --------------------------------- PREPARE -------------------------------- */
const caller = `0x${'1'.repeat(40)}` as const;
const recipient = `0x${'2'.repeat(40)}` as const;
const amount = BigInt(1e18);
// Use two separate tokens to exclude impact of calling the same contract again
const tokenA = `0x${'3'.repeat(40)}` as const;
const tokenB = `0x${'4'.repeat(40)}` as const;
// GasliteDrop contract to airdrop tokens

const prepare = async () => {
  // Create client
  const tevm = await createMemoryClient({
    fork: {
      url: 'https://mainnet.optimism.io',
    },
  });

  // Set the token contracts
  await tevm.setAccount({
    address: tokenA,
    deployedBytecode: MOCKERC20_BYTECODE,
  });
  await tevm.setAccount({
    address: tokenB,
    deployedBytecode: MOCKERC20_BYTECODE,
  });

  return tevm;
};

/* ----------------------------- MINT + APPROVE ----------------------------- */
// Minting and approving for both tokens will have no gas difference
// whether we use createTransaction: true or false
const mintAndApproveBoth = async (tevm: TevmClient) => {
  for (const token of [tokenA, tokenB]) {
    const { errors: errorsMint } = await tevm.contract({
      caller,
      to: token,
      abi: MOCKERC20_ABI,
      functionName: 'mint',
      args: [caller, amount],
      createTransaction: true,
    });

    const { errors: errorsApprove } = await tevm.contract({
      caller,
      to: token,
      abi: MOCKERC20_ABI,
      functionName: 'approve',
      args: [GASLITEDROP_ADDRESS, amount],
      createTransaction: true,
    });

    if (errorsMint) console.log('Mint Errors:', errorsMint);
    if (errorsApprove) console.log('Approval Errors:', errorsApprove);
  }
};

/* --------------------------------- AIRDROP -------------------------------- */
const airdropBoth = async (tevm: TevmClient) => {
  const returnValues = {
    false: {
      gasUsed: 0,
      gasRefund: 0,
    },
    true: {
      gasUsed: 0,
      gasRefund: 0,
    },
  };

  for (const token of [tokenA, tokenB]) {
    const createTransaction = token === tokenB; // false for tokenA, true for tokenB
    const { executionGasUsed, gasRefund, errors } = await tevm.contract({
      caller,
      to: GASLITEDROP_ADDRESS,
      abi: GASLITEDROP_ABI,
      functionName: 'airdropERC20',
      args: [token, [recipient], [amount], amount],
      createTransaction,
    });

    if (errors) console.log('Errors:', errors);

    returnValues[`${createTransaction}`].gasUsed = Number(executionGasUsed);
    returnValues[`${createTransaction}`].gasRefund = Number(gasRefund) || 0;
  }

  return returnValues;
};

/* ---------------------------------- MAIN ---------------------------------- */
const run = async () => {
  const tevm = await prepare();

  // Mint and approve
  await mintAndApproveBoth(tevm);
  // Airdrop tokens
  const gasData = await airdropBoth(tevm);
  const diff = {
    gasUsed: Number(gasData.true.gasUsed) - Number(gasData.false.gasUsed),
    gasRefund: Number(gasData.true.gasRefund) - Number(gasData.false.gasRefund),
  };

  console.table({
    ...gasData,
    diff,
  });
  // ? LOGS:
  // ┌─────────┬─────────┬───────────┐
  // │ (index) │ gasUsed │ gasRefund │
  // ├─────────┼─────────┼───────────┤
  // │  false  │  63218  │   29500   │
  // │  true   │  51118  │   59700   │
  // │  diff   │ -12100  │   30200   │
  // └─────────┴─────────┴───────────┘
  // ? 'airdropERC20' with createTransaction: true used 12,100 less gas
  // ? and refunded 30,200 more gas than with createTransaction: false
};

run();
