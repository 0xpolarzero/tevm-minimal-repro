// tevm@1.0.0-next.33
// Run with: pnpm ts-node call-gaslimit/index.ts
import { createMemoryClient, encodeFunctionData, TevmClient } from 'tevm';
import {
  MOCKERC20_BYTECODE,
  MOCKERC20_ABI,
  GASLITEDROP_ADDRESS,
  GASLITEDROP_ABI,
} from '../constants';

const run = async () => {
  const caller = `0x${'1'.repeat(40)}` as const;
  // Create client
  const tevm = await createMemoryClient({
    fork: {
      // Replace with a custom API key if this one is unavailable
      url: 'https://opt-mainnet.g.alchemy.com/v2/KAT18h7aCmxJeGoKu6zR6mtuph_vYWoB',
    },
  });

  // Set the token contract
  const token = '0x1823FbFF49f731061E8216ad2467112C0469cBFD';
  await tevm.setAccount({
    address: token,
    deployedBytecode: MOCKERC20_BYTECODE,
  });

  // Prepare airdrop args (1000 random recipients)
  const { recipients, amounts, totalAmount } = prepareArgs(800);
  const args = [token, recipients, amounts, totalAmount];
  // Mint tokens
  await mintTokens(tevm, caller, token, totalAmount);
  // Approve spending of tokens by GasliteDrop
  await approveGasliteDrop(tevm, caller, token, totalAmount);

  // Airdrop tokens
  const {
    executionGasUsed,
    errors: airdropErrors,
    gas,
  } = await tevm.call({
    caller,
    to: GASLITEDROP_ADDRESS,
    data: encodeFunctionData({
      abi: GASLITEDROP_ABI,
      functionName: 'airdropERC20',
      args,
    }),
    createTransaction: true,
  });

  console.log('Execution gas used:', executionGasUsed);
  // ? LOGS: 16776931n
  console.log('Gas left:', gas);
  // ? LOGS: 284n
  // ? => Not enough gas left because of the 0xffffff limit
  console.log('Errors:', airdropErrors ?? 'none');
  // ? LOGS: [{ name: 'revert', _tag: 'revert', message: '0x' }]
};

/* -------------------------------------------------------------------------- */
/*                                    UTILS                                   */
/* -------------------------------------------------------------------------- */

const prepareArgs = (
  numRecipients: number,
): { recipients: `0x${string}`[]; amounts: string[]; totalAmount: string } => {
  const singleAmount = BigInt(1e18);
  const recipients = Array.from(
    { length: numRecipients },
    (_, i) => `0x${i.toString().padStart(40, '0')}` as `0x${string}`,
  );
  const amounts = Array.from({ length: numRecipients }, () =>
    singleAmount.toString(),
  );
  const totalAmount = (singleAmount * BigInt(recipients.length)).toString();

  return { recipients, amounts, totalAmount };
};

const mintTokens = async (
  tevm: TevmClient,
  caller: `0x${string}`,
  token: `0x${string}`,
  amount: string,
) => {
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
};

const approveGasliteDrop = async (
  tevm: TevmClient,
  caller: `0x${string}`,
  token: `0x${string}`,
  amount: string,
) => {
  const { errors: approveErrors } = await tevm.call({
    caller,
    to: token,
    data: encodeFunctionData({
      abi: MOCKERC20_ABI,
      functionName: 'approve',
      args: [GASLITEDROP_ADDRESS, amount],
    }),
    createTransaction: true,
  });

  console.log('Approval errors:', approveErrors ?? 'none');
};

run();
