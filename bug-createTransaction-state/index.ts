// tevm@1.0.0-next.44
// @tevm/opstack@1.0.0-next.43
// Run with: pnpm ts-node bug-createTransaction-state/index.ts
import {
  createGasPriceOracle,
  createL1Block,
  L1Client,
  createL1Client,
} from '@tevm/opstack';

/* --------------------------------- PREPARE -------------------------------- */
const DEPOSITOR_ACCOUNT = '0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001';
const GasPriceOracle = createGasPriceOracle();
const L1Block = createL1Block();

const prepare = async () => {
  // Create client
  const client = createL1Client();

  // Set contracts
  await client.setAccount({
    address: L1Block.address,
    deployedBytecode: L1Block.deployedBytecode,
  });
  await client.setAccount({
    address: GasPriceOracle.address,
    deployedBytecode: GasPriceOracle.deployedBytecode,
  });

  return client;
};

/* ------------------------------- SET ECOTONE ------------------------------ */
const setEcotoneAndCheck = async (client: L1Client) => {
  try {
    // Set Ecotone
    await client.contract({
      ...GasPriceOracle.write.setEcotone(),
      caller: DEPOSITOR_ACCOUNT,
      createTransaction: true,
    });

    // Check if Ecotone is active
    const { data: ecotoneActivatedCreateTransactionFalse } =
      await client.contract({
        ...GasPriceOracle.read.isEcotone(),
      });

    // Check again with createTransaction: true
    const { data: ecotoneActivatedcreateTransactionTrue } =
      await client.contract({
        ...GasPriceOracle.read.isEcotone(),
        createTransaction: true,
      });

    return {
      ecotoneActivatedCreateTransactionFalse,
      ecotoneActivatedcreateTransactionTrue,
    };
  } catch (err) {
    console.error('Error:', err);
    return {};
  }
};

/* ---------------------------------- MAIN ---------------------------------- */
const run = async () => {
  const client = await prepare();

  // Set Ecotone and get both results
  const {
    ecotoneActivatedCreateTransactionFalse,
    ecotoneActivatedcreateTransactionTrue,
  } = await setEcotoneAndCheck(client);
  console.log(
    'Ecotone activated (createTransaction: false):',
    ecotoneActivatedCreateTransactionFalse
  );
  console.log(
    'Ecotone activated (createTransaction: true):',
    ecotoneActivatedcreateTransactionTrue
  );

  // ? LOGS:
  // Ecotone activated (createTransaction: false): false
  // Ecotone activated (createTransaction: true): true
  // ? Both should return true but without `createTransaction` it returns false
};

run();
