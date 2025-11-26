import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Configurar clientes para Anvil (puerto por defecto: 8545)
const publicClient = createPublicClient({
  chain: foundry,
  transport: http('http://127.0.0.1:8545'),
});

const walletClient = createWalletClient({
  chain: foundry,
  transport: http('http://127.0.0.1:8545'),
});

// Cuentas por defecto de Anvil (primeras dos)
const ACCOUNT_1_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ACCOUNT_2_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

const account1 = privateKeyToAccount(ACCOUNT_1_PRIVATE_KEY);

async function main() {
  console.log('=== Ejemplo de acceso a Anvil con viem ===\n');

  // 1. Obtener el último bloque (lastBlock)
  console.log('1. Obteniendo el último bloque...');
  const block = await publicClient.getBlock();
  console.log(`   Número de bloque: ${block.number}`);
  console.log(`   Hash: ${block.hash}`);
  console.log(`   Timestamp: ${block.timestamp}`);
  console.log(`   Transacciones: ${block.transactions.length}\n`);

  // 2. Consultar balance
  console.log('2. Consultando balances...');
  const balance1 = await publicClient.getBalance({
    address: account1.address,
  });
  const balance2 = await publicClient.getBalance({
    address: ACCOUNT_2_ADDRESS,
  });

  console.log(`   Balance cuenta 1 (${account1.address}): ${formatEther(balance1)} ETH`);
  console.log(`   Balance cuenta 2 (${ACCOUNT_2_ADDRESS}): ${formatEther(balance2)} ETH\n`);

  // 3. Realizar una transferencia
  console.log('3. Realizando transferencia de 1 ETH...');
  const transferAmount = parseEther('1');

  const hash = await walletClient.sendTransaction({
    account: account1,
    to: ACCOUNT_2_ADDRESS,
    value: transferAmount,
  });

  console.log(`   Hash de transacción: ${hash}`);

  // Esperar a que se mine la transacción
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`   Transacción minada en bloque: ${receipt.blockNumber}`);
  console.log(`   Estado: ${receipt.status === 'success' ? 'Exitosa' : 'Fallida'}\n`);

  // Verificar nuevos balances
  console.log('4. Verificando nuevos balances...');
  const newBalance1 = await publicClient.getBalance({
    address: account1.address,
  });
  const newBalance2 = await publicClient.getBalance({
    address: ACCOUNT_2_ADDRESS,
  });

  console.log(`   Nuevo balance cuenta 1: ${formatEther(newBalance1)} ETH`);
  console.log(`   Nuevo balance cuenta 2: ${formatEther(newBalance2)} ETH`);

  console.log('\n✓ Ejemplo completado');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
