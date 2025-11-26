// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MyToken} from "../src/MyToken.sol";

contract DeployMyToken is Script {
    function run() external returns (MyToken) {
        // Parámetros de configuración
        string memory name = "MyToken";
        string memory symbol = "MTK";
        uint256 initialSupply = 1_000_000; // 1 millón de tokens

        vm.startBroadcast();

        MyToken token = new MyToken(name, symbol, initialSupply);

        console.log("Token deployed at:", address(token));
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("Initial Supply:", initialSupply);
        console.log("Total Supply (wei):", token.totalSupply());
        console.log("Owner:", token.owner());

        vm.stopBroadcast();

        return token;
    }
}
