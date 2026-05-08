// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Test USDC token for ARC Testnet deployment
 * @dev This is a mock token with 6 decimals like real USDC
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        // Empty constructor - use initialize() or mint() after deployment
    }
    
    /**
     * @notice USDC uses 6 decimals (not 18)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @notice Initialize contract with initial supply
     * @dev Mints 1,000,000 USDC to deployer
     */
    function initialize() public {
        require(totalSupply() == 0, "Already initialized");
        _mint(msg.sender, 1000000 * 10**decimals()); // 1M USDC
    }
    
    /**
     * @notice Mint tokens to any address (for testing)
     * @param to Address to receive tokens
     * @param amount Amount of tokens (with 6 decimals)
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens from caller
     * @param amount Amount to burn
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
    
    /**
     * @notice Helper function to mint with human-readable amounts
     * @param to Address to receive tokens
     * @param amountInUSDC Amount in USDC (automatically converts to 6 decimals)
     * @dev Example: mintReadable(address, 1000) mints 1000 USDC
     */
    function mintReadable(address to, uint256 amountInUSDC) public {
        _mint(to, amountInUSDC * 10**decimals());
    }
}
