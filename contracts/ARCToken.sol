// contracts/ARCToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ARCToken (KRN)
 * @notice ERC20 token optimized for Arc Testnet deployment
 * @dev Keren Token (KRN) - Native token for Smart DeFi Router ecosystem
 * 
 * Features:
 * - Fixed supply of 10,000,000 KRN
 * - Burnable tokens
 * - Owner controls for additional minting (if needed)
 * - Optimized for Arc Testnet (Chain ID: 5042002)
 * 
 * Token Details:
 * - Name: Keren Token
 * - Symbol: KRN
 * - Decimals: 18 (standard ERC20)
 * - Total Supply: 10,000,000 KRN
 */
contract ARCToken is ERC20, ERC20Burnable, Ownable {
    
    // Maximum supply that can ever exist
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100M tokens max
    
    // Initial supply minted to deployer
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18; // 10M tokens
    
    // Track if initial mint has occurred
    bool private _initialMintCompleted;
    
    // Events
    event TokensBurned(address indexed burner, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);
    
    /**
     * @notice Constructor - Deploys the token and mints initial supply
     * @dev Mints 10M KRN tokens to the deployer address
     */
    constructor() ERC20("Keren Token", "KRN") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, INITIAL_SUPPLY);
        _initialMintCompleted = true;
        
        emit TokensMinted(msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @notice Mint additional tokens (owner only)
     * @dev Can only mint up to MAX_SUPPLY
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint (in wei, with 18 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @notice Burn tokens from caller's balance
     * @dev Inherited from ERC20Burnable, emits custom event
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @notice Burn tokens from specified address (with allowance)
     * @dev Inherited from ERC20Burnable, emits custom event
     * @param account Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }
    
    /**
     * @notice Get token information
     * @return tokenName Name of the token
     * @return tokenSymbol Symbol of the token
     * @return tokenDecimals Number of decimals
     * @return tokenTotalSupply Current total supply
     * @return tokenMaxSupply Maximum possible supply
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenMaxSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY
        );
    }
    
    /**
     * @notice Check remaining mintable supply
     * @return Amount of tokens that can still be minted
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @notice Emergency withdrawal of accidentally sent tokens
     * @dev Owner can recover ERC20 tokens sent to this contract by mistake
     * @param token Address of the ERC20 token to recover
     * @param amount Amount to recover
     */
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot recover KRN tokens");
        require(token != address(0), "Invalid token address");
        
        IERC20(token).transfer(owner(), amount);
    }
    
    /**
     * @notice Get balance of an address in human-readable format
     * @param account Address to check
     * @return Balance with 18 decimals (wei)
     */
    function balanceOfAddress(address account) external view returns (uint256) {
        return balanceOf(account);
    }
} 