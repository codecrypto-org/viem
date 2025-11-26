import { createPublicClient, http, formatEther } from 'viem';
import { foundry } from 'viem/chains';
import { mnemonicToAccount } from 'viem/accounts';

// Mnemonic por defecto de Anvil
const ANVIL_MNEMONIC = 'test test test test test test test test test test test junk';

// Cliente público para consultar balances
const publicClient = createPublicClient({
  chain: foundry,
  transport: http('http://127.0.0.1:8545'),
});

interface AccountInfo {
  index: number;
  address: string;
  privateKey: string;
  balance?: string;
}

/**
 * Deriva múltiples cuentas desde un mnemonic
 */
async function listAccountsFromMnemonic(
  mnemonic: string,
  count: number = 10,
  checkBalance: boolean = true
): Promise<AccountInfo[]> {
  const accounts: AccountInfo[] = [];

  console.log(`Derivando ${count} cuentas desde el mnemonic...\n`);

  for (let i = 0; i < count; i++) {
    // Derivar cuenta usando el path estándar de Ethereum (m/44'/60'/0'/0/index)
    const account = mnemonicToAccount(mnemonic, {
      addressIndex: i,
    });

    const accountInfo: AccountInfo = {
      index: i,
      address: account.address,
      privateKey: account.getHdKey().privateKey
        ? `0x${Buffer.from(account.getHdKey().privateKey!).toString('hex')}`
        : 'N/A',
    };

    // Consultar balance si está habilitado
    if (checkBalance) {
      try {
        const balance = await publicClient.getBalance({
          address: account.address,
        });
        accountInfo.balance = formatEther(balance);
      } catch (error) {
        accountInfo.balance = 'Error al consultar';
      }
    }

    accounts.push(accountInfo);
  }

  return accounts;
}

/**
 * Imprime la información de las cuentas de forma legible
 */
function printAccounts(accounts: AccountInfo[]) {
  console.log('='.repeat(100));
  console.log('CUENTAS DERIVADAS DEL MNEMONIC');
  console.log('='.repeat(100));

  accounts.forEach((account) => {
    console.log(`\nCuenta #${account.index}`);
    console.log(`  Address:     ${account.address}`);
    console.log(`  Private Key: ${account.privateKey}`);
    if (account.balance !== undefined) {
      console.log(`  Balance:     ${account.balance} ETH`);
    }
  });

  console.log('\n' + '='.repeat(100));
}

/**
 * Función principal
 */
async function main() {
  // Usar el mnemonic de Anvil o uno personalizado desde argumentos
  const mnemonic = process.argv[2] || ANVIL_MNEMONIC;
  const accountCount = parseInt(process.argv[3] || '10');

  console.log('Lista de Cuentas desde Mnemonic\n');
  console.log(`Mnemonic: ${mnemonic}`);
  console.log(`Derivando ${accountCount} cuentas...\n`);

  try {
    // Verificar si Anvil está corriendo (opcional)
    let anvilRunning = false;
    try {
      await publicClient.getBlockNumber();
      anvilRunning = true;
      console.log('✓ Anvil detectado - consultando balances\n');
    } catch {
      console.log('⚠ Anvil no detectado - solo se mostrarán direcciones y claves privadas\n');
    }

    // Listar cuentas
    const accounts = await listAccountsFromMnemonic(mnemonic, accountCount, anvilRunning);

    // Imprimir resultados
    printAccounts(accounts);

    // Resumen
    if (anvilRunning) {
      const totalBalance = accounts.reduce((sum, acc) => {
        return sum + parseFloat(acc.balance || '0');
      }, 0);
      console.log(`\nBalance Total: ${totalBalance.toFixed(4)} ETH`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
