#!/bin/bash

# Script para desplegar el contrato ERC20 y ejecutar operaciones

echo "======================================"
echo "DEPLOY Y TEST DE TOKEN ERC20"
echo "======================================"

# Verificar que Anvil esté corriendo
echo ""
echo "🔍 Verificando que Anvil esté corriendo..."
if ! curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://127.0.0.1:8545 > /dev/null 2>&1; then
  echo "❌ Error: Anvil no está corriendo"
  echo "Por favor ejecuta 'anvil' en otra terminal"
  exit 1
fi
echo "✅ Anvil está corriendo"

# Ir al directorio sc
cd sc || exit 1

# Deploy del contrato
echo ""
echo "🚀 Desplegando contrato MyToken..."
DEPLOY_OUTPUT=$(forge script script/DeployMyToken.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  2>&1)

# Extraer la dirección del contrato deployado
TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o "Token deployed at: 0x[a-fA-F0-9]*" | grep -o "0x[a-fA-F0-9]*")

if [ -z "$TOKEN_ADDRESS" ]; then
  echo "❌ Error: No se pudo obtener la dirección del contrato"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo "✅ Token deployado en: $TOKEN_ADDRESS"

# Volver al directorio principal
cd ..

# Ejecutar operaciones con el token
echo ""
echo "💰 Ejecutando operaciones con el token..."
echo ""
npm run token-ops "$TOKEN_ADDRESS"
