# Ejemplo de Anvil con viem

Este ejemplo demuestra cómo interactuar con Anvil (nodo local de Ethereum) usando TypeScript y viem.

## Programas

### 1. anvil-example.ts
Ejemplo básico de interacción con Anvil:
- **lastBlock**: Obtener información del último bloque
- **balance**: Consultar el balance de cuentas
- **transfer**: Realizar transferencias entre cuentas

### 2. list-accounts.ts
Lista cuentas derivadas de un mnemonic:
- Deriva múltiples cuentas HD desde un mnemonic (BIP-44)
- Muestra direcciones y claves privadas
- Consulta balances si Anvil está corriendo
- Usa el mnemonic de Anvil por defecto para pruebas

## Requisitos previos

1. **Foundry (Anvil)** instalado:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

## Instalación

```bash
npm install
```

## Uso

### Ejemplo básico (anvil-example.ts)

1. **Iniciar Anvil** en una terminal:
   ```bash
   anvil
   ```

2. **Ejecutar el ejemplo** en otra terminal:
   ```bash
   npm start
   ```

### Listar cuentas desde mnemonic (list-accounts.ts)

```bash
# Usar el mnemonic de Anvil por defecto (primeras 10 cuentas)
npm run list-accounts

# Usar un mnemonic personalizado
npm run list-accounts "tu mnemonic aquí"

# Especificar número de cuentas a derivar
npm run list-accounts "tu mnemonic aquí" 20
```

**Nota**: Si Anvil está corriendo, el programa consultará los balances automáticamente.

## Notas

- El ejemplo usa las cuentas por defecto de Anvil que vienen pre-financiadas con 10,000 ETH
- Anvil se ejecuta por defecto en `http://127.0.0.1:8545`
- La transferencia de ejemplo envía 1 ETH de la cuenta 1 a la cuenta 2
- **Mnemonic de Anvil**: `test test test test test test test test test test test junk`
- Las cuentas se derivan usando el path estándar de Ethereum: `m/44'/60'/0'/0/{index}`
