// tevm@1.0.0-next.44
// Run with: pnpm ts-node bug-sendBulk/index.ts
import { createGasPriceOracle } from '@tevm/opstack';
import {
  JsonRpcReturnTypeFromMethod,
  MemoryClient,
  createMemoryClient,
} from 'tevm';

/* --------------------------------- PREPARE -------------------------------- */
const GasPriceOracle = createGasPriceOracle();

const prepare = async () => {
  // Create client
  return createMemoryClient({
    fork: {
      url: 'https://mainnet.optimism.io',
    },
  });
};

/* -------------------------------- SEND BULK ------------------------------- */
const sendBulkJson = async (client: MemoryClient) => {
  try {
    const responses: JsonRpcReturnTypeFromMethod<'tevm_call'>[] =
      await client.sendBulk([
        {
          method: 'tevm_call',
          params: [GasPriceOracle.read.baseFeeScalar()],
          id: 1,
          jsonrpc: '2.0',
        },
        {
          method: 'tevm_call',
          params: [GasPriceOracle.read.blobBaseFeeScalar()],
          id: 2,
          jsonrpc: '2.0',
        },
      ]);

    return responses;
  } catch (err) {
    console.error('Error:', err);
    return [];
  }
};

/* ---------------------------------- MAIN ---------------------------------- */
const run = async () => {
  const client = await prepare();

  // Send a bulk of JSON-RPC requests (only one for testing)
  const responses = await sendBulkJson(client);

  responses.forEach((response) => {
    console.log('Errors: ', response.error);
    console.log('Result: ', response.result);
  });

  // ? LOGS:
  // Errors:  { code: 'revert', message: '0x', data: { errors: [ '0x' ] } }
  // Result:  undefined
  // Errors:  { code: 'revert', message: '0x', data: { errors: [ '0x' ] } }
  // Result:  undefined
  // ? Both should return true but without `createTransaction` it returns false
};

run();
