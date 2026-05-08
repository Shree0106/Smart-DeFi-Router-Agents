// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns(bool);
    function balanceOf(address account) external view returns(uint256);
    function allowance(address owner, address spender) external view returns(uint256);
    function approve(address spender, uint256 amount) external returns(bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns(bool);
}

interface IProtocol {
    function deposit(uint256 amount) external returns(uint256);
    function withdraw(uint256 amount) external returns(uint256);
    function getYield() external view returns(uint256);
    function getUserBalance(address user) external view returns(uint256);
}

/**
 * @title SmartDeFiRouter
 * @notice AI-powered DeFi router that optimizes USDC placement across protocols on Arc
 * @dev Implements yield optimization, risk management, and automated rebalancing
 */
contract SmartDeFiRouter {
    address public owner;
    address public usdcToken;
    
    // Protocol tracking
    struct Protocol {
        address protocolAddress;
        string name;
        uint256 riskScore;        // 1-100, lower is safer
        uint256 currentYield;     // APY in basis points (100 = 1%)
        uint256 totalDeposited;
        uint256 liquidity;
        bool isActive;
        uint256 lastUpdateTime;
    }
    
    // User position tracking
    struct Position {
        address protocol;
        uint256 amount;
        uint256 entryTime;
        uint256 entryYield;
    }
    
    // Route optimization data
    struct Route {
        address[] protocols;
        uint256[] amounts;
        uint256 expectedYield;
        uint256 riskScore;
        uint256 timestamp;
    }
    
    // User strategy preferences
    struct Strategy {
        uint256 targetYield;      // Minimum yield in basis points
        uint256 maxRisk;          // Maximum risk score (1-100)
        uint256 duration;         // Investment duration in seconds
        bool autoRebalance;       // Enable automatic rebalancing
        uint256 rebalanceThreshold; // Yield drop % to trigger rebalance
    }
    
    mapping(uint256 => Protocol) public protocols;
    mapping(address => Position[]) public userPositions;
    mapping(address => Strategy) public userStrategies;
    mapping(address => Route) public activeRoutes;
    mapping(address => uint256) public totalUserBalance;
    
    uint256 public protocolCount;
    uint256 public totalValueLocked;
    uint256 public constant BASIS_POINTS = 10000;
    
    event ProtocolAdded(uint256 indexed protocolId, string name, address protocolAddress);
    event ProtocolUpdated(uint256 indexed protocolId, uint256 yield, uint256 riskScore);
    event RouteOptimized(address indexed user, uint256 expectedYield, uint256 riskScore);
    event PositionOpened(address indexed user, address protocol, uint256 amount);
    event PositionClosed(address indexed user, address protocol, uint256 amount);
    event Rebalanced(address indexed user, uint256 oldYield, uint256 newYield);
    event StrategyUpdated(address indexed user, uint256 targetYield, uint256 maxRisk);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
    }
    
    /**
     * @notice Register a new DeFi protocol
     */
    function addProtocol(
        address _protocolAddress,
        string memory _name,
        uint256 _riskScore,
        uint256 _currentYield
    ) external onlyOwner {
        require(_riskScore <= 100, "Risk score must be 1-100");
        
        protocols[protocolCount] = Protocol({
            protocolAddress: _protocolAddress,
            name: _name,
            riskScore: _riskScore,
            currentYield: _currentYield,
            totalDeposited: 0,
            liquidity: 0,
            isActive: true,
            lastUpdateTime: block.timestamp
        });
        
        emit ProtocolAdded(protocolCount, _name, _protocolAddress);
        protocolCount++;
    }
    
    /**
     * @notice Update protocol metrics (called by AI oracle or owner)
     */
    function updateProtocol(
        uint256 _protocolId,
        uint256 _yield,
        uint256 _riskScore,
        uint256 _liquidity
    ) external onlyOwner {
        require(_protocolId < protocolCount, "Invalid protocol");
        Protocol storage protocol = protocols[_protocolId];
        
        protocol.currentYield = _yield;
        protocol.riskScore = _riskScore;
        protocol.liquidity = _liquidity;
        protocol.lastUpdateTime = block.timestamp;
        
        emit ProtocolUpdated(_protocolId, _yield, _riskScore);
    }
    
    /**
     * @notice Set user's investment strategy
     */
    function setStrategy(
        uint256 _targetYield,
        uint256 _maxRisk,
        uint256 _duration,
        bool _autoRebalance,
        uint256 _rebalanceThreshold
    ) external {
        require(_maxRisk <= 100, "Max risk must be 1-100");
        
        userStrategies[msg.sender] = Strategy({
            targetYield: _targetYield,
            maxRisk: _maxRisk,
            duration: _duration,
            autoRebalance: _autoRebalance,
            rebalanceThreshold: _rebalanceThreshold
        });
        
        emit StrategyUpdated(msg.sender, _targetYield, _maxRisk);
    }
    
    /**
     * @notice Calculate optimal route based on user strategy
     * @dev This is a simplified version - production would use off-chain AI
     */
    function calculateOptimalRoute(address _user, uint256 _amount) 
        public 
        view 
        returns (
            address[] memory,
            uint256[] memory,
            uint256,
            uint256
        ) 
    {
        Strategy memory strategy = userStrategies[_user];
        require(strategy.maxRisk > 0, "Strategy not set");
        
        // Find protocols matching risk criteria
        uint256 eligibleCount = 0;
        uint256[] memory eligibleIds = new uint256[](protocolCount);
        
        for (uint256 i = 0; i < protocolCount; i++) {
            if (protocols[i].isActive && 
                protocols[i].riskScore <= strategy.maxRisk &&
                protocols[i].currentYield >= strategy.targetYield) {
                eligibleIds[eligibleCount] = i;
                eligibleCount++;
            }
        }
        
        require(eligibleCount > 0, "No protocols match criteria");
        
        // Simple optimization: distribute to top 3 highest yield protocols
        address[] memory resultProtocols = new address[](eligibleCount > 3 ? 3 : eligibleCount);
        uint256[] memory resultAmounts = new uint256[](eligibleCount > 3 ? 3 : eligibleCount);
        
        uint256 totalYield = 0;
        uint256 totalRisk = 0;
        
        for (uint256 i = 0; i < (eligibleCount > 3 ? 3 : eligibleCount); i++) {
            Protocol memory p = protocols[eligibleIds[i]];
            resultProtocols[i] = p.protocolAddress;
            resultAmounts[i] = _amount / (eligibleCount > 3 ? 3 : eligibleCount);
            totalYield += p.currentYield;
            totalRisk += p.riskScore;
        }
        
        uint256 finalYield = totalYield / (eligibleCount > 3 ? 3 : eligibleCount);
        uint256 finalRisk = totalRisk / (eligibleCount > 3 ? 3 : eligibleCount);
        
        return (resultProtocols, resultAmounts, finalYield, finalRisk);
    }
    
    /**
     * @notice Execute optimized route and deposit USDC
     */
    function executeRoute(uint256 _amount) public {
        require(_amount > 0, "Amount must be > 0");
        require(userStrategies[msg.sender].maxRisk > 0, "Set strategy first");
        
        // Transfer USDC from user
        IERC20(usdcToken).transferFrom(msg.sender, address(this), _amount);
        
        // Calculate optimal route
        (
            address[] memory protocols,
            uint256[] memory amounts,
            uint256 expectedYield,
            uint256 riskScore
        ) = calculateOptimalRoute(msg.sender, _amount);
        
        // Execute deposits
        for (uint256 i = 0; i < protocols.length; i++) {
            if (amounts[i] > 0) {
                IERC20(usdcToken).approve(protocols[i], amounts[i]);
                
                // Record position
                userPositions[msg.sender].push(Position({
                    protocol: protocols[i],
                    amount: amounts[i],
                    entryTime: block.timestamp,
                    entryYield: expectedYield
                }));
                
                emit PositionOpened(msg.sender, protocols[i], amounts[i]);
            }
        }
        
        // Store active route
        activeRoutes[msg.sender] = Route({
            protocols: protocols,
            amounts: amounts,
            expectedYield: expectedYield,
            riskScore: riskScore,
            timestamp: block.timestamp
        });
        
        totalUserBalance[msg.sender] += _amount;
        totalValueLocked += _amount;
        
        emit RouteOptimized(msg.sender, expectedYield, riskScore);
    }
    
    /**
     * @notice Withdraw all positions
     */
    function withdrawAll() public {
        Position[] storage positions = userPositions[msg.sender];
        require(positions.length > 0, "No positions");
        
        uint256 totalWithdrawn = 0;
        
        for (uint256 i = 0; i < positions.length; i++) {
            Position memory pos = positions[i];
            totalWithdrawn += pos.amount;
            emit PositionClosed(msg.sender, pos.protocol, pos.amount);
        }
        
        delete userPositions[msg.sender];
        delete activeRoutes[msg.sender];
        
        totalUserBalance[msg.sender] = 0;
        totalValueLocked -= totalWithdrawn;
        
        // Transfer USDC back to user
        IERC20(usdcToken).transfer(msg.sender, totalWithdrawn);
    }
    
    /**
     * @notice Check if rebalancing is needed
     */
    function shouldRebalance(address _user) public view returns (bool) {
        Strategy memory strategy = userStrategies[_user];
        if (!strategy.autoRebalance) return false;
        
        Route memory route = activeRoutes[_user];
        if (route.timestamp == 0) return false;
        
        // Recalculate current expected yield
        (,,uint256 newYield,) = calculateOptimalRoute(_user, totalUserBalance[_user]);
        
        // Check if yield dropped below threshold
        uint256 yieldDrop = route.expectedYield > newYield ? 
            ((route.expectedYield - newYield) * 100) / route.expectedYield : 0;
            
        return yieldDrop >= strategy.rebalanceThreshold;
    }
    
    /**
     * @notice Rebalance user's positions
     */
    function rebalance() external {
        require(shouldRebalance(msg.sender), "Rebalancing not needed");
        
        Route memory oldRoute = activeRoutes[msg.sender];
        uint256 totalAmount = totalUserBalance[msg.sender];
        
        // Withdraw all
        withdrawAll();
        
        // Re-execute with current balance
        IERC20(usdcToken).transferFrom(msg.sender, address(this), totalAmount);
        executeRoute(totalAmount);
        
        Route memory newRoute = activeRoutes[msg.sender];
        emit Rebalanced(msg.sender, oldRoute.expectedYield, newRoute.expectedYield);
    }
    
    /**
     * @notice Get user's current positions
     */
    function getUserPositions(address _user) 
        external 
        view 
        returns (Position[] memory) 
    {
        return userPositions[_user];
    }
    
    /**
     * @notice Get user's active route
     */
    function getActiveRoute(address _user) 
        external 
        view 
        returns (
            address[] memory,
            uint256[] memory,
            uint256,
            uint256,
            uint256
        ) 
    {
        Route memory route = activeRoutes[_user];
        return (
            route.protocols,
            route.amounts,
            route.expectedYield,
            route.riskScore,
            route.timestamp
        );
    }
    
    /**
     * @notice Get protocol details
     */
    function getProtocol(uint256 _protocolId) 
        external 
        view 
        returns (Protocol memory) 
    {
        require(_protocolId < protocolCount, "Invalid protocol");
        return protocols[_protocolId];
    }
    
    /**
     * @notice Get all active protocols
     */
    function getAllProtocols() external view returns (Protocol[] memory) {
        Protocol[] memory allProtocols = new Protocol[](protocolCount);
        for (uint256 i = 0; i < protocolCount; i++) {
            allProtocols[i] = protocols[i];
        }
        return allProtocols;
    }
    
    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(owner, _amount);
    }
}
