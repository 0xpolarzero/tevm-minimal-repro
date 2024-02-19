// Run with: pnpm ts-node benchmarks-loop/index.ts
import { TevmClient, createMemoryClient } from 'tevm';
import { MOCKERC1155_BYTECODE, MOCKERC1155_ABI } from '../constants';

/* --------------------------------- RESULTS -------------------------------- */
/**
 * Time for 1 iterations:     1.032 s
 *
 * Time for 10 iterations:    1.282 s
 * Time for 20 iterations:    1.464 s
 * Time for 50 iterations:    4.346 s
 *
 * Time for 100 iterations:   6.663 s
 * Time for 200 iterations:   13.508 s
 * Time for 500 iterations:   43.762 s
 *
 * Time for 1000 iterations:  71.831 s
 * Time for 2000 iterations:  136.043 s
 * Time for 5000 iterations:  408.35 s
 */

/* ---------------------------------- TEVM ---------------------------------- */
const caller = `0x${'1'.repeat(40)}` as const;
const token = '0x171593d3E5Bc8A2E869600F951ed532B9780Cbd2';
let tevm: TevmClient;

// Batch mint provided tokens ids/amounts pairs
const batchMint = async (ids: bigint[], amounts: bigint[]) => {
  const { errors: mintErrors } = await tevm.contract({
    caller,
    to: token,
    abi: MOCKERC1155_ABI,
    functionName: 'batchMint',
    args: [caller, ids, amounts],
    createTransaction: true,
    gas: BigInt(1_000_000_000),
  });
  if (mintErrors) console.log('Errors:', mintErrors);
};

// Create the Tevm client and set the token contract to a MockERC1155
const prepare = async () => {
  tevm = await createMemoryClient({
    fork: {
      // Replace with a custom API key if this one is unavailable
      url: 'https://opt-mainnet.g.alchemy.com/v2/KAT18h7aCmxJeGoKu6zR6mtuph_vYWoB',
    },
  });

  await tevm.setAccount({
    address: token,
    deployedBytecode: MOCKERC1155_BYTECODE,
  });
};

/* ------------------------------- BENCHMARKS ------------------------------- */
// Create mock ids/amounts with the given length (step) and call `batchMint`
// Return the time it took to execute the `batchMint` call
const runStep = async (step: number) => {
  const ids = Array(step)
    .fill(0)
    .map((_, i) => BigInt(i));
  const amounts = Array(step).fill(BigInt('1000000000000000000'));

  const start = Date.now();
  await batchMint(ids, amounts);
  const end = Date.now();

  console.log(`Time for ${step} iterations:`, (end - start) / 1000, 's');
};

// Run the `runStep` function for each step in the provided array
const runIncrementalSteps = async (steps: number[]) => {
  await prepare();
  // I guess we could use `Promise.all` here but that makes the first steps
  // less accurate; although these are not the most significant ones
  for (const step of steps) {
    await runStep(step);
  }
};

// Run the benchmarks for the provided steps
// This will basically call `batchMint` with mock ids/amounts, each time with
// the given array length
runIncrementalSteps([1, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000])
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
