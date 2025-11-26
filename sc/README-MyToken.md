# MyToken - ERC20 Token

Contrato ERC20 completo con funcionalidades extendidas desarrollado con Foundry y OpenZeppelin.

## Características

- **ERC20 Estándar**: Implementación completa del estándar ERC20
- **Minteo**: El owner puede crear nuevos tokens
- **Quemado**: Los holders pueden quemar sus propios tokens
- **Ownership**: Control de acceso basado en owner
- **Supply Inicial**: Configurable al momento del deployment
- **18 Decimales**: Estándar de la industria

## Estructura del Proyecto

```
sc/
├── src/
│   └── MyToken.sol          # Contrato ERC20 principal
├── test/
│   └── MyToken.t.sol        # Suite completa de tests
├── script/
│   └── DeployMyToken.s.sol  # Script de deployment
└── foundry.toml             # Configuración de Foundry
```

## Instalación

```bash
# Instalar dependencias
forge install
```

## Testing

```bash
# Ejecutar todos los tests
forge test

# Con mayor verbosidad
forge test -vv

# Ver gas report
forge test --gas-report

# Ejecutar un test específico
forge test --match-test test_Mint -vvv
```

### Cobertura de Tests

Los tests incluyen:
- ✅ Deployment y configuración inicial
- ✅ Transfers básicos y con allowance
- ✅ Minteo de tokens (solo owner)
- ✅ Quemado de tokens (burnFrom)
- ✅ Transferencia de ownership
- ✅ Tests de reverting (errores esperados)
- ✅ Fuzz testing para transfer y mint

## Deployment

### En Anvil (Local)

1. Iniciar Anvil en una terminal:
```bash
anvil
```

2. Hacer deploy en otra terminal:
```bash
forge script script/DeployMyToken.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### En otras redes

```bash
# Sepolia testnet
forge script script/DeployMyToken.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Mainnet (¡CUIDADO!)
forge script script/DeployMyToken.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## Interacción con el Contrato

### Usando Cast (CLI de Foundry)

```bash
# Leer información del token
cast call <TOKEN_ADDRESS> "name()" --rpc-url http://127.0.0.1:8545
cast call <TOKEN_ADDRESS> "symbol()" --rpc-url http://127.0.0.1:8545
cast call <TOKEN_ADDRESS> "totalSupply()" --rpc-url http://127.0.0.1:8545

# Consultar balance
cast call <TOKEN_ADDRESS> "balanceOf(address)" <WALLET_ADDRESS> --rpc-url http://127.0.0.1:8545

# Transferir tokens
cast send <TOKEN_ADDRESS> "transfer(address,uint256)" <TO_ADDRESS> 1000000000000000000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY>

# Mintear tokens (solo owner)
cast send <TOKEN_ADDRESS> "mint(address,uint256)" <TO_ADDRESS> 1000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <OWNER_PRIVATE_KEY>
```

## Funciones Principales

### Lectura (view/pure)

- `name()`: Nombre del token
- `symbol()`: Símbolo del token
- `decimals()`: Número de decimales (18)
- `totalSupply()`: Supply total de tokens
- `balanceOf(address)`: Balance de una dirección
- `allowance(address,address)`: Allowance aprobado

### Escritura

- `transfer(address to, uint256 amount)`: Transferir tokens
- `approve(address spender, uint256 amount)`: Aprobar gasto de tokens
- `transferFrom(address from, address to, uint256 amount)`: Transferir desde allowance
- `mint(address to, uint256 amount)`: Mintear tokens (solo owner)
- `burn(uint256 amount)`: Quemar propios tokens
- `burnFrom(address from, uint256 amount)`: Quemar tokens aprobados

## Ejemplo de Uso con TypeScript/viem

```typescript
import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { foundry } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const tokenAddress = '0x...'; // Dirección del token deployado

// Leer balance
const balance = await publicClient.readContract({
  address: tokenAddress,
  abi: [{
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }],
  functionName: 'balanceOf',
  args: ['0x...']
});

// Transferir tokens
const hash = await walletClient.writeContract({
  address: tokenAddress,
  abi: [/* ABI del ERC20 */],
  functionName: 'transfer',
  args: ['0x...', parseEther('100')]
});
```

## Configuración del Constructor

El constructor acepta 3 parámetros:

```solidity
constructor(
    string memory name,        // Ej: "MyToken"
    string memory symbol,      // Ej: "MTK"
    uint256 initialSupply      // Ej: 1000000 (= 1M tokens)
)
```

**Nota**: `initialSupply` se especifica en unidades completas (no en wei). El contrato automáticamente multiplica por 10^18.

## Seguridad

- ✅ Usa contratos auditados de OpenZeppelin v5.5.0
- ✅ Control de acceso con `Ownable`
- ✅ Protección contra reentrancy (incluida en ERC20 de OZ)
- ✅ Suite completa de tests
- ⚠️ El minteo ilimitado es controlado por el owner

## Licencia

MIT
