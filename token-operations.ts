import { createPublicClient, createWalletClient, http, formatEther, parseEther } from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Configuración de Anvil
const ANVIL_RPC = 'http://127.0.0.1:8545';

// Cuentas de Anvil (primeras 3)
const OWNER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const USER1_PRIVATE_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const USER2_PRIVATE_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);
const user1Account = privateKeyToAccount(USER1_PRIVATE_KEY);
const user2Account = privateKeyToAccount(USER2_PRIVATE_KEY);

// ABI del token ERC20 (funciones necesarias)
const TOKEN_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Clientes
const publicClient = createPublicClient({
  chain: foundry,
  transport: http(ANVIL_RPC),
});

const ownerWalletClient = createWalletClient({
  account: ownerAccount,
  chain: foundry,
  transport: http(ANVIL_RPC),
});

const user1WalletClient = createWalletClient({
  account: user1Account,
  chain: foundry,
  transport: http(ANVIL_RPC),
});

/**
 * Obtiene información básica del token
 */
async function getTokenInfo(tokenAddress: `0x${string}`) {
  const [name, symbol, totalSupply] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'name',
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'symbol',
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'totalSupply',
    }),
  ]);

  return { name, symbol, totalSupply };
}

/**
 * Consulta el balance de una dirección
 */
async function getBalance(tokenAddress: `0x${string}`, address: `0x${string}`) {
  const balance = await publicClient.readContract({
    address: tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });
  return balance;
}

/**
 * Muestra los balances de todas las cuentas
 */
async function showBalances(tokenAddress: `0x${string}`, label: string) {
  console.log(`\n${label}`);
  console.log('='.repeat(80));

  const [ownerBalance, user1Balance, user2Balance] = await Promise.all([
    getBalance(tokenAddress, ownerAccount.address),
    getBalance(tokenAddress, user1Account.address),
    getBalance(tokenAddress, user2Account.address),
  ]);

  console.log(`  Owner  (${ownerAccount.address}): ${formatEther(ownerBalance)} MTK`);
  console.log(`  User 1 (${user1Account.address}): ${formatEther(user1Balance)} MTK`);
  console.log(`  User 2 (${user2Account.address}): ${formatEther(user2Balance)} MTK`);

  const total = ownerBalance + user1Balance + user2Balance;
  console.log(`  Total en cuentas: ${formatEther(total)} MTK`);
}

/**
 * Mintea tokens a una dirección
 */
async function mintTokens(
  tokenAddress: `0x${string}`,
  to: `0x${string}`,
  amount: number
) {
  console.log(`\n🪙 Minteando ${amount} tokens a ${to}...`);

  const hash = await ownerWalletClient.writeContract({
    address: tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'mint',
    args: [to, BigInt(amount)],
  });

  console.log(`  Tx hash: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ✅ Minteo completado en bloque ${receipt.blockNumber}`);

  return receipt;
}

/**
 * Transfiere tokens entre cuentas
 */
async function transferTokens(
  tokenAddress: `0x${string}`,
  from: typeof ownerWalletClient | typeof user1WalletClient,
  fromName: string,
  to: `0x${string}`,
  toName: string,
  amount: bigint
) {
  console.log(`\n💸 Transfiriendo ${formatEther(amount)} MTK de ${fromName} a ${toName}...`);

  const hash = await from.writeContract({
    address: tokenAddress,
    abi: TOKEN_ABI,
    functionName: 'transfer',
    args: [to, amount],
  });

  console.log(`  Tx hash: ${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ✅ Transferencia completada en bloque ${receipt.blockNumber}`);

  return receipt;
}

/**
 * Función principal
 */
async function main() {
  console.log('='.repeat(80));
  console.log('OPERACIONES CON TOKEN ERC20');
  console.log('='.repeat(80));

  // Obtener la dirección del token desde argumentos
  const tokenAddress = process.argv[2] as `0x${string}`;

  if (!tokenAddress || !tokenAddress.startsWith('0x')) {
    console.error('\n❌ Error: Debes proporcionar la dirección del contrato');
    console.log('\nUso:');
    console.log('  npm run token-ops <TOKEN_ADDRESS>');
    console.log('\nEjemplo:');
    console.log('  npm run token-ops 0x5FbDB2315678afecb367f032d93F642f64180aa3');
    process.exit(1);
  }

  try {
    // 1. Verificar conexión con Anvil
    console.log('\n🔌 Verificando conexión con Anvil...');
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`  ✅ Conectado - Bloque actual: ${blockNumber}`);

    // 2. Obtener información del token
    console.log('\n📋 Información del Token');
    console.log('='.repeat(80));
    const tokenInfo = await getTokenInfo(tokenAddress);
    console.log(`  Dirección: ${tokenAddress}`);
    console.log(`  Nombre: ${tokenInfo.name}`);
    console.log(`  Símbolo: ${tokenInfo.symbol}`);
    console.log(`  Total Supply: ${formatEther(tokenInfo.totalSupply)} ${tokenInfo.symbol}`);

    // 3. Mostrar balances iniciales
    await showBalances(tokenAddress, '💰 Balances Iniciales');

    // 4. Mintear tokens a User1
    await mintTokens(tokenAddress, user1Account.address, 5000);
    await showBalances(tokenAddress, '💰 Balances después del minteo');

    // 5. Mintear tokens a User2
    await mintTokens(tokenAddress, user2Account.address, 3000);
    await showBalances(tokenAddress, '💰 Balances después del segundo minteo');

    // 6. User1 transfiere tokens a User2
    await transferTokens(
      tokenAddress,
      user1WalletClient,
      'User1',
      user2Account.address,
      'User2',
      parseEther('1000')
    );
    await showBalances(tokenAddress, '💰 Balances después de la transferencia User1 → User2');

    // 7. Owner transfiere tokens a User1
    const ownerBalance = await getBalance(tokenAddress, ownerAccount.address);
    if (ownerBalance > 0n) {
      await transferTokens(
        tokenAddress,
        ownerWalletClient,
        'Owner',
        user1Account.address,
        'User1',
        parseEther('10000')
      );
      await showBalances(tokenAddress, '💰 Balances después de la transferencia Owner → User1');
    }

    // 8. Resumen final
    console.log('\n' + '='.repeat(80));
    console.log('✅ TODAS LAS OPERACIONES COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(80));

    const finalTotalSupply = await publicClient.readContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'totalSupply',
    });
    console.log(`\nTotal Supply Final: ${formatEther(finalTotalSupply)} MTK`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
