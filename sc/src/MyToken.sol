// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MyToken
 * @dev Implementación de un token ERC20 con funcionalidades de:
 * - Minteo controlado por el owner
 * - Quemado de tokens
 * - Supply inicial
 */
contract MyToken is ERC20, ERC20Burnable, Ownable {
    /// @dev Número de decimales del token
    uint8 private constant DECIMALS = 18;

    /**
     * @dev Constructor que crea el token con un supply inicial
     * @param name Nombre del token
     * @param symbol Símbolo del token
     * @param initialSupply Supply inicial (en unidades, no en wei)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        // Mintear el supply inicial al creador del contrato
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    /**
     * @dev Función para mintear nuevos tokens (solo owner)
     * @param to Dirección que recibirá los tokens
     * @param amount Cantidad de tokens a mintear (en unidades, no en wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount * 10 ** decimals());
    }

    /**
     * @dev Retorna el número de decimales del token
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
}
