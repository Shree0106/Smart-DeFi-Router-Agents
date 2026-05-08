// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ARCToken (KRN) - Keren Token
 * @notice ERC20 token optimized for Arc Testnet deployment
 * @dev Native token for Smart DeFi Router ecosystem on Arc Testnet
 * 
 * 🌐 ARC TESTNET CONFIGURATION:
 * - Chain ID: 5042002 (0x4CEDF2)
 * - RPC URL: https://rpc.testnet.arc.network
 * - Currency: USDC (used for gas fees, 6 decimals)
 * - Explorer: https://testnet.arcscan.app
 * - Faucet: https://faucet.circle.com
 * 
 * 📋 TOKEN DETAILS:
 * - Name: Keren Token
 * - Symbol: KRN
 * - Decimals: 18 (standard ERC20)
 * - Initial Supply: 10,000,000 KRN
 * - Max Supply: 100,000,000 KRN
 * 
 * ✨ FEATURES:
 * - ✅ ERC20 Standard Compliant
 * - ✅ Burnable tokens
 * - ✅ Mintable (owner only, capped at max supply)
 * - ✅ Ownership transfer capability
 * - ✅ Emergency token recovery
 * - ✅ Detailed events for tracking
 * - ✅ View functions for token info
 * 
 * 🚀 DEPLOYMENT INSTRUCTIONS (REMIX):
 * 1. Open Remix IDE: https://remix.ethereum.org
 * 2. Create new file: ARCToken.sol
 * 3. Paste this entire contract
 * 4. Compile with Solidity 0.8.20+
 * 5. In MetaMask, add Arc Testnet:
 *    - Network Name: Arc Testnet
 *    - RPC URL: https://rpc.testnet.arc.network
 *    - Chain ID: 5042002
 *    - Currency Symbol: USDC
 *    - Block Explorer: https://testnet.arcscan.app
 * 6. Get USDC from faucet: https://faucet.circle.com
 * 7. Deploy using "Injected Provider - MetaMask"
 * 8. Verify on: https://testnet.arcscan.app
 */

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 */
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

/**
 * @dev Provides information about the current execution context.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

/**
 * @dev Implementation of the {IERC20} interface.
 */
contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _totalSupply += amount;
        unchecked {
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            _totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}

/**
 * @title ARCToken - Main Token Contract
 * @notice This is the main Keren Token (KRN) contract for the Smart DeFi Router
 */
contract ARCToken is ERC20, Ownable {
    
    // ============ CONSTANTS ============
    
    /// @notice Maximum supply that can ever exist (100M tokens)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    /// @notice Initial supply minted to deployer (10M tokens)
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 10**18;
    
    // ============ STATE VARIABLES ============
    
    /// @notice Track if initial mint has occurred
    bool private _initialMintCompleted;
    
    // ============ EVENTS ============
    
    /// @notice Emitted when tokens are burned
    event TokensBurned(address indexed burner, uint256 amount);
    
    /// @notice Emitted when tokens are minted
    event TokensMinted(address indexed to, uint256 amount);
    
    /// @notice Emitted when tokens are recovered from contract
    event TokensRecovered(address indexed token, address indexed to, uint256 amount);
    
    // ============ CONSTRUCTOR ============
    
    /**
     * @notice Deploy the token and mint initial supply
     * @dev Mints 10M KRN tokens to the deployer address
     */
    constructor() ERC20("Keren Token", "KRN") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
        _initialMintCompleted = true;
        
        emit TokensMinted(msg.sender, INITIAL_SUPPLY);
    }
    
    // ============ EXTERNAL FUNCTIONS ============
    
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
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to burn");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @notice Burn tokens from specified address (with allowance)
     * @param account Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external {
        require(account != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        
        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
        
        emit TokensBurned(account, amount);
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
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).transfer(owner(), amount);
        emit TokensRecovered(token, owner(), amount);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get comprehensive token information
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
     * @notice Get balance of an address
     * @param account Address to check
     * @return Balance with 18 decimals (wei)
     */
    function balanceOfAddress(address account) external view returns (uint256) {
        return balanceOf(account);
    }
    
    /**
     * @notice Check if initial mint was completed
     * @return Boolean indicating if initial mint happened
     */
    function isInitialMintCompleted() external view returns (bool) {
        return _initialMintCompleted;
    }
}

/**
 * 📝 DEPLOYMENT NOTES:
 * 
 * After deployment on Arc Testnet:
 * 1. Save the contract address
 * 2. Verify on https://testnet.arcscan.app
 * 3. Test basic functions:
 *    - Check balance: balanceOf(yourAddress)
 *    - Check total supply: totalSupply()
 *    - Try transfer: transfer(recipientAddress, amount)
 * 4. Update your frontend constants with the deployed address
 * 5. Add token to MetaMask:
 *    - Token Address: <your deployed address>
 *    - Token Symbol: KRN
 *    - Decimals: 18
 * 
 * 🔐 SECURITY REMINDERS:
 * - Keep your private key secure
 * - This is a TESTNET deployment - do not use on mainnet without audit
 * - Test all functions thoroughly before production use
 * - Consider getting a professional audit for mainnet deployment
 */
