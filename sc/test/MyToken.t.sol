// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MyToken} from "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken public token;
    address public owner;
    address public user1;
    address public user2;

    uint256 constant INITIAL_SUPPLY = 1_000_000; // 1 millón de tokens
    string constant TOKEN_NAME = "MyToken";
    string constant TOKEN_SYMBOL = "MTK";

    event Transfer(address indexed from, address indexed to, uint256 value);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy del token
        token = new MyToken(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_SUPPLY);
    }

    /* ============ Tests de Deployment ============ */

    function test_InitialSetup() public view {
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY * 10 ** 18);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY * 10 ** 18);
    }

    function test_OwnerIsDeployer() public view {
        assertEq(token.owner(), owner);
    }

    /* ============ Tests de Transfer ============ */

    function test_Transfer() public {
        uint256 amount = 100 * 10 ** 18;

        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, user1, amount);

        token.transfer(user1, amount);

        assertEq(token.balanceOf(user1), amount);
        assertEq(token.balanceOf(owner), (INITIAL_SUPPLY * 10 ** 18) - amount);
    }

    function test_TransferFrom() public {
        uint256 amount = 100 * 10 ** 18;

        // Owner aprueba a user1 para gastar tokens
        token.approve(user1, amount);

        // user1 transfiere tokens del owner a user2
        vm.prank(user1);
        token.transferFrom(owner, user2, amount);

        assertEq(token.balanceOf(user2), amount);
        assertEq(token.balanceOf(owner), (INITIAL_SUPPLY * 10 ** 18) - amount);
    }

    function test_RevertWhen_TransferInsufficientBalance() public {
        // Intentar transferir más tokens de los que tiene
        vm.expectRevert();
        token.transfer(user1, (INITIAL_SUPPLY * 10 ** 18) + 1);
    }

    /* ============ Tests de Mint ============ */

    function test_Mint() public {
        uint256 mintAmount = 1000; // 1000 tokens
        uint256 expectedAmount = mintAmount * 10 ** 18;

        token.mint(user1, mintAmount);

        assertEq(token.balanceOf(user1), expectedAmount);
        assertEq(
            token.totalSupply(),
            (INITIAL_SUPPLY * 10 ** 18) + expectedAmount
        );
    }

    function test_RevertWhen_MintFromNonOwner() public {
        // user1 intenta mintear (debería fallar)
        vm.expectRevert();
        vm.prank(user1);
        token.mint(user2, 1000);
    }

    /* ============ Tests de Burn ============ */

    function test_Burn() public {
        uint256 burnAmount = 100 * 10 ** 18;
        uint256 initialBalance = token.balanceOf(owner);

        token.burn(burnAmount);

        assertEq(token.balanceOf(owner), initialBalance - burnAmount);
        assertEq(token.totalSupply(), (INITIAL_SUPPLY * 10 ** 18) - burnAmount);
    }

    function test_BurnFrom() public {
        uint256 burnAmount = 100 * 10 ** 18;

        // Transferir tokens a user1
        token.transfer(user1, burnAmount);

        // user1 aprueba a owner para quemar sus tokens
        vm.prank(user1);
        token.approve(owner, burnAmount);

        // Owner quema los tokens de user1
        token.burnFrom(user1, burnAmount);

        assertEq(token.balanceOf(user1), 0);
    }

    /* ============ Tests de Ownership ============ */

    function test_TransferOwnership() public {
        token.transferOwnership(user1);
        assertEq(token.owner(), user1);
    }

    function test_RevertWhen_TransferOwnershipFromNonOwner() public {
        vm.expectRevert();
        vm.prank(user1);
        token.transferOwnership(user2);
    }

    /* ============ Fuzz Tests ============ */

    function testFuzz_Transfer(address to, uint256 amount) public {
        // Evitar direcciones problemáticas
        vm.assume(to != address(0));
        vm.assume(to != owner);
        vm.assume(amount > 0 && amount <= INITIAL_SUPPLY * 10 ** 18);

        token.transfer(to, amount);

        assertEq(token.balanceOf(to), amount);
        assertEq(token.balanceOf(owner), (INITIAL_SUPPLY * 10 ** 18) - amount);
    }

    function testFuzz_Mint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        vm.assume(amount > 0 && amount <= 1_000_000); // Límite razonable

        uint256 initialTotalSupply = token.totalSupply();
        uint256 expectedAmount = amount * 10 ** 18;

        token.mint(to, amount);

        assertEq(token.balanceOf(to), expectedAmount);
        assertEq(token.totalSupply(), initialTotalSupply + expectedAmount);
    }
}
