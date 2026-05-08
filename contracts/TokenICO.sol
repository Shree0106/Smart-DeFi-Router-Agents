// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns(bool);
    function balanceOf(address account) external view returns(uint256);
    function allowance(address owner, address spender) external view returns(uint256);
    function approve(address spender, uint256 amount) external returns(bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns(bool);
    function symbol() external view returns(string memory);
    function totalSupply() external view returns(uint256);
    function name() external view returns(string memory);
}

contract TokenICO {
    address public owner;
    address public tokenAddress;
    uint256 public tokenSalePrice;
    uint256 public soldTokens;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Update token
    function updateToken(address _tokenAddress) public onlyOwner {
        tokenAddress = _tokenAddress;
    }

    // Update token's sales price
    function updateTokenSalePrice(uint256 _tokenSalePrice) public onlyOwner {
        tokenSalePrice = _tokenSalePrice;
    }

    // Multiply
    function multiply(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "Multiplication overflow");
        return z;
    }

    // Buy Token
    function buyToken(uint256 _tokenAmount) public payable {
        require(msg.value == multiply(_tokenAmount, tokenSalePrice), "Incorrect Ether sent");
        IERC20 token = IERC20(tokenAddress);
        uint256 tokenAmountWithDecimals = _tokenAmount * 1e18;
        require(tokenAmountWithDecimals <= token.balanceOf(address(this)), "Not enough tokens in contract");
        require(token.transfer(msg.sender, tokenAmountWithDecimals), "Token transfer failed");
        payable(owner).transfer(msg.value);
        soldTokens += _tokenAmount;
    }

    // Get Token Details
    function getTokenDetails() public view returns (
        string memory name, 
        string memory symbol, 
        uint256 balance, 
        uint256 supply, 
        uint256 tokenPrice, 
        address tokenAddr
    ) {
        IERC20 token = IERC20(tokenAddress);
        return (
            token.name(), 
            token.symbol(), 
            token.balanceOf(address(this)), 
            token.totalSupply(), 
            tokenSalePrice, 
            tokenAddress
        );
    }

    // Transfer to Owner
    function transferToOwner(uint256 _amount) external payable {
        require(msg.value >= _amount, "Insufficient Ether sent");
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Transfer to owner failed");   
    }

    // Transfer Ether
    function transferEther(address payable _recipient, uint256 _amount) external payable {
        require(msg.value >= _amount, "Insufficient Ether sent");
        (bool success, ) = _recipient.call{value: _amount}("");
        require(success, "Transfer to recipient failed");
    }

    // Withdraw all tokens
    function withdrawAllTokens() public onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(token.transfer(owner, balance), "Token transfer failed");
    }
}