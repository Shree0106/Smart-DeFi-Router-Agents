import React, { useState, useEffect, useContext } from "react";
import { FaRobot, FaChartLine, FaShieldAlt, FaCoins, FaHistory, FaWallet, FaExternalLinkAlt } from "react-icons/fa";
import { IoMdTrendingUp, IoMdSwap } from "react-icons/io";
import { MdAutorenew } from "react-icons/md";
import { TOKEN_ICO_Context } from "../context/index";
import { ethers } from "ethers";
import { 
  GET_ACTIVE_ROUTE, 
  GET_ALL_PROTOCOLS_VIA_API,
  CHECK_WALLET_CONNECTED,
  WITHDRAW_ALL,
  SHOULD_REBALANCE,
  REBALANCE,
  TOKEN_ADDRESS,
  ERC20_ABI
} from "../context/constants";

const AgentDashboard = ({ routerData: initialRouterData, userPositions: initialUserPositions, protocols: initialProtocols }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletBalance, setWalletBalance] = useState("0");
  const [activeRoute, setActiveRoute] = useState(null);
  const [protocols, setProtocols] = useState(initialProtocols || []);
  const [userPositions, setUserPositions] = useState(initialUserPositions || []);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shouldRebal, setShouldRebal] = useState(false);
  const [routerData, setRouterData] = useState(initialRouterData || {});

  const { account, loader, setLoader, ERC20, CHECK_ACCOUNT_BALANCE } = useContext(TOKEN_ICO_Context);

  // Fetch USDC token balance for connected wallet
  const fetchUSDCBalance = async (address) => {
    try {
      console.log("🔍 Fetching USDC balance for:", address);
      console.log("📍 Token address:", TOKEN_ADDRESS);
      
      if (!window.ethereum) {
        console.log("❌ No ethereum provider");
        return "0";
      }

      // Try multiple methods to get balance
      
      // Method 1: Direct contract call with MetaMask provider
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(address);
        const formattedBalance = ethers.formatEther(balance);
        console.log("✅ USDC Balance (Method 1 - MetaMask):", formattedBalance);
        return formattedBalance;
      } catch (method1Error) {
        console.log("⚠️ Method 1 failed:", method1Error.message);
        
        // Method 2: Try with fallback RPC
        try {
          const fallbackRpc = "https://rpc.testnet.arc.network";
          const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpc);
          const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, fallbackProvider);
          const balance = await tokenContract.balanceOf(address);
          const formattedBalance = ethers.formatEther(balance);
          console.log("✅ USDC Balance (Method 2 - Fallback RPC):", formattedBalance);
          return formattedBalance;
        } catch (method2Error) {
          console.log("⚠️ Method 2 failed:", method2Error.message);
          
          // Method 3: Use context's ERC20 function
          try {
            if (ERC20) {
              const balance = await ERC20(TOKEN_ADDRESS, address);
              console.log("✅ USDC Balance (Method 3 - Context ERC20):", balance);
              return balance || "0";
            }
          } catch (method3Error) {
            console.log("⚠️ Method 3 failed:", method3Error.message);
          }
        }
      }
      
      return "0";
    } catch (error) {
      console.error("❌ All methods failed to fetch USDC balance:", error);
      return "0";
    }
  };

  // Fetch wallet data when component mounts or account changes
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        // First priority: Use account from context (set by wallet connection)
        let address = account;
        
        // If no account in context, check if wallet is connected
        if (!address) {
          address = await CHECK_WALLET_CONNECTED();
        }
        
        if (!address) {
          // Wallet is NOT connected - clear all data
          console.log("⚠️ No wallet connected");
          setWalletConnected(false);
          setWalletAddress("");
          setWalletBalance("0");
          setActiveRoute(null);
          setUserPositions([]);
          setShouldRebal(false);
          return;
        }

        // Wallet IS connected - fetch data
        console.log("✅ Wallet connected, fetching data for:", address);
        setWalletConnected(true);
        setWalletAddress(address);
        
        console.log("💰 Fetching USDC balance for connected wallet:", address);
        
        // Fetch USDC token balance immediately
        try {
          const usdcBalance = await fetchUSDCBalance(address);
          console.log("💵 Setting wallet balance to:", usdcBalance);
          setWalletBalance(usdcBalance);
        } catch (error) {
          console.error("❌ Balance fetch failed:", error);
          setWalletBalance("0");
        }

          // Fetch active route/positions
          try {
            const route = await GET_ACTIVE_ROUTE();
            setActiveRoute(route);
            
            // Convert route to user positions
            if (route && route.protocols && route.protocols.length > 0) {
              const positions = route.protocols.map((protocolAddr, index) => {
                // Find protocol name from protocols list
                const protocol = protocols.find(p => 
                  p.address?.toLowerCase() === protocolAddr.toLowerCase()
                );
                
                return {
                  protocolAddress: protocolAddr,
                  protocolName: protocol?.name || `Protocol ${index + 1}`,
                  amount: route.amounts[index] || "0",
                  apy: protocol?.current_yield || 0,
                  duration: 30, // Default duration
                  earned: (parseFloat(route.amounts[index] || 0) * (protocol?.current_yield || 0) / 100 / 12).toFixed(2), // Rough monthly estimate
                  timestamp: route.timestamp || Date.now(),
                };
              });
              setUserPositions(positions);
              
              // Update router data
              const totalInvested = positions.reduce((sum, p) => sum + parseFloat(p.amount), 0);
              const avgYield = positions.reduce((sum, p, i) => sum + (p.apy * parseFloat(p.amount)), 0) / totalInvested || 0;
              const totalEarned = positions.reduce((sum, p) => sum + parseFloat(p.earned), 0);
              
              setRouterData(prev => ({
                ...prev,
                totalValueLocked: totalInvested.toFixed(2),
                averageYield: avgYield.toFixed(2),
                riskScore: route.riskScore || prev.riskScore,
                activeProtocols: positions.length.toString(),
                totalEarned: totalEarned.toFixed(2),
              }));
            } else {
              // No active route - clear positions
              setUserPositions([]);
            }
          } catch (error) {
            console.log("Active route fetch failed");
            setUserPositions([]);
          }

          // Check if rebalancing is needed
          try {
            const needsRebalance = await SHOULD_REBALANCE();
            setShouldRebal(needsRebalance);
          } catch (error) {
            console.log("Rebalance check failed");
            setShouldRebal(false);
          }

          // Mock transaction data (in production, fetch from blockchain or API)
          setTransactions([
            {
              id: 1,
              type: "deposit",
              amount: 1000,
              protocol: "Arc Lending Protocol",
              status: "completed",
              timestamp: Date.now() - 86400000 * 2,
              txHash: "0x1234...5678",
            },
            {
              id: 2,
              type: "deposit",
              amount: 500,
              protocol: "Arc Staking Pool",
              status: "completed",
              timestamp: Date.now() - 86400000 * 5,
              txHash: "0xabcd...efgh",
            },
            {
              id: 3,
              type: "withdraw",
              amount: 200,
              protocol: "Arc Liquidity Pool",
              status: "completed",
              timestamp: Date.now() - 86400000 * 10,
              txHash: "0x9876...5432",
            },
          ]);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        // On error, ensure wallet is marked as disconnected
        setWalletConnected(false);
        setWalletAddress("");
        setWalletBalance("0");
      }
    };

    fetchWalletData();
    
    // Set up interval to refresh data periodically when wallet is connected
    const interval = setInterval(() => {
      if (account || walletConnected) {
        console.log("🔄 Auto-refreshing wallet data...");
        fetchWalletData();
      }
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [account, walletConnected]); // Re-run when account changes

  // Fetch protocols from API
  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const protocolsData = await GET_ALL_PROTOCOLS_VIA_API();
        const formattedProtocols = protocolsData.map(p => ({
          address: p.address,
          name: p.name,
          isActive: p.is_active,
          yield: p.current_yield,
          risk: p.risk_score,
          tvl: (parseFloat(p.total_deposited) / 1000000).toFixed(2), // Convert to millions
        }));
        setProtocols(formattedProtocols);
      } catch (error) {
        console.log("Failed to fetch protocols, using defaults");
      }
    };

    if (protocols.length === 0) {
      fetchProtocols();
    }
  }, []);

  const handleWithdraw = async (positionIndex) => {
    if (!walletConnected) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setLoader(true);
      await WITHDRAW_ALL();
      alert("Withdrawal successful! Please refresh to see updated balances.");
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal failed: " + error.message);
    } finally {
      setLoader(false);
    }
  };

  const handleRebalance = async () => {
    if (!walletConnected) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setLoader(true);
      await REBALANCE();
      alert("Rebalancing successful!");
      window.location.reload();
    } catch (error) {
      console.error("Rebalancing failed:", error);
      alert("Rebalancing failed: " + error.message);
    } finally {
      setLoader(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (!walletConnected || !walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Manually refreshing USDC balance...");
      const usdcBalance = await fetchUSDCBalance(walletAddress);
      setWalletBalance(usdcBalance);
      console.log("✅ Balance refreshed:", usdcBalance);
    } catch (error) {
      console.error("❌ Balance refresh failed:", error);
      alert("Failed to refresh balance: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <section id="dashboard" className="agent-dashboard pos-rel pt-140 pb-105">
      <div className="container">
        <div className="sec-title text-center mb-50">
          <h5 className="sec-title__subtitle">
            <FaRobot /> AI-Powered DeFi Router
          </h5>
          <h2 className="sec-title__title">Smart Agent Dashboard</h2>
          <p className="sec-title__text">
            Monitor your optimized USDC positions across Arc's DeFi ecosystem
          </p>
          {walletConnected && (
            <div className="wallet-info">
              <FaWallet style={{ marginRight: '8px' }} />
              <span>Connected: {shortenAddress(walletAddress)}</span>
              <span style={{ marginLeft: '15px', color: '#4ade80' }}>
                Balance: {parseFloat(walletBalance).toFixed(4)} USDC
              </span>
              <button 
                onClick={handleRefreshBalance}
                disabled={loading}
                style={{
                  marginLeft: '10px',
                  padding: '5px 12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '5px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                title="Refresh USDC balance"
              >
                🔄 Refresh
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        <div className="dashboard-stats">
          <div className="row">
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCoins />
                </div>
                <div className="stat-info">
                  <h4>{routerData?.totalValueLocked || "0"} USDC</h4>
                  <p>Total Value Locked</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <IoMdTrendingUp />
                </div>
                <div className="stat-info">
                  <h4>{routerData?.averageYield || "0"}% APY</h4>
                  <p>Current Yield</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaShieldAlt />
                </div>
                <div className="stat-info">
                  <h4>{routerData?.riskScore || "0"}/100</h4>
                  <p>Portfolio Risk Score</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="stat-icon">
                  <IoMdSwap />
                </div>
                <div className="stat-info">
                  <h4>{routerData?.activeProtocols || "0"}</h4>
                  <p>Active Protocols</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs mt-50">
          <div className="tab-buttons">
            <button
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={activeTab === "positions" ? "active" : ""}
              onClick={() => setActiveTab("positions")}
            >
              My Positions
            </button>
            <button
              className={activeTab === "transactions" ? "active" : ""}
              onClick={() => setActiveTab("transactions")}
            >
              Transaction History
            </button>
            <button
              className={activeTab === "protocols" ? "active" : ""}
              onClick={() => setActiveTab("protocols")}
            >
              Available Protocols
            </button>
            <button
              className={activeTab === "ai" ? "active" : ""}
              onClick={() => setActiveTab("ai")}
            >
              AI Recommendations
            </button>
          </div>

          <div className="tab-content mt-30">
            {activeTab === "overview" && (
              <div className="overview-content">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="info-card">
                      <h3>
                        <FaChartLine /> Portfolio Performance
                      </h3>
                      <div className="performance-chart">
                        <div className="chart-item">
                          <span className="label">Total Invested:</span>
                          <span className="value">{routerData?.totalValueLocked || "0"} USDC</span>
                        </div>
                        <div className="chart-item">
                          <span className="label">Current Yield:</span>
                          <span className="value positive">{routerData?.averageYield || "0"}% APY</span>
                        </div>
                        <div className="chart-item">
                          <span className="label">Total Earned:</span>
                          <span className="value positive">
                            +{routerData?.totalEarned || "0"} USDC
                          </span>
                        </div>
                        <div className="chart-item">
                          <span className="label">Wallet Balance:</span>
                          <span className="value">
                            {parseFloat(walletBalance).toFixed(4)} USDC
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="info-card">
                      <h3>
                        <MdAutorenew /> Auto-Rebalance Status
                      </h3>
                      <div className="rebalance-info">
                        <p>
                          <strong>Rebalance Needed:</strong>{" "}
                          <span style={{ color: shouldRebal ? '#fbbf24' : '#4ade80' }}>
                            {shouldRebal ? "Yes - Action Required" : "No - Optimal"}
                          </span>
                        </p>
                        <p>
                          <strong>Active Positions:</strong>{" "}
                          {userPositions.length}
                        </p>
                        <p>
                          <strong>Total Protocols:</strong>{" "}
                          {protocols.filter(p => p.isActive).length} available
                        </p>
                        {shouldRebal && (
                          <button 
                            className="thm-btn mt-10"
                            onClick={handleRebalance}
                            disabled={loading}
                          >
                            {loading ? "Processing..." : "Rebalance Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "positions" && (
              <div className="positions-content">
                <div className="positions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Protocol</th>
                        <th>Amount</th>
                        <th>APY</th>
                        <th>Earned (Est.)</th>
                        <th>Risk</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPositions && userPositions.length > 0 ? (
                        userPositions.map((position, index) => (
                          <tr key={index}>
                            <td>{position.protocolName}</td>
                            <td>{parseFloat(position.amount).toFixed(4)} USDC</td>
                            <td className="positive">{position.apy}%</td>
                            <td className="positive">+{position.earned} USDC</td>
                            <td>
                              <span className={
                                position.risk < 30 ? "low-risk" : 
                                position.risk < 70 ? "medium-risk" : "high-risk"
                              }>
                                {protocols.find(p => p.address?.toLowerCase() === position.protocolAddress?.toLowerCase())?.risk || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn-small"
                                onClick={() => handleWithdraw(index)}
                                disabled={loading}
                              >
                                Withdraw
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            {walletConnected 
                              ? "No active positions. Visit Route Optimizer to start investing!"
                              : "Connect your wallet to view positions"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div className="transactions-content">
                <div className="transactions-header">
                  <h3>
                    <FaHistory /> Recent Transactions
                  </h3>
                </div>
                <div className="transactions-list">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div className="tx-icon">
                          {tx.type === "deposit" ? "↓" : "↑"}
                        </div>
                        <div className="tx-details">
                          <h4>{tx.type === "deposit" ? "Deposit" : "Withdrawal"}</h4>
                          <p>{tx.protocol}</p>
                          <p className="tx-time">{formatTimestamp(tx.timestamp)}</p>
                        </div>
                        <div className="tx-amount">
                          <span className={tx.type === "deposit" ? "positive" : "negative"}>
                            {tx.type === "deposit" ? "+" : "-"}{tx.amount} USDC
                          </span>
                          <span className={`status ${tx.status}`}>{tx.status}</span>
                        </div>
                        <a 
                          href={`https://testnet.arcscan.app/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          <FaExternalLinkAlt />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-center" style={{ padding: '40px' }}>
                      <FaHistory style={{ fontSize: '48px', opacity: 0.3, marginBottom: '15px' }} />
                      <p>
                        {walletConnected 
                          ? "No transactions yet. Start by investing through the Route Optimizer!"
                          : "Connect your wallet to view transaction history"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "protocols" && (
              <div className="protocols-content">
                <div className="row">
                  {protocols && protocols.length > 0 ? (
                    protocols.map((protocol, index) => (
                      <div className="col-lg-4 col-md-6" key={index}>
                        <div className="protocol-card">
                          <div className="protocol-header">
                            <h4>{protocol.name}</h4>
                            <span
                              className={`status ${
                                protocol.isActive ? "active" : "inactive"
                              }`}
                            >
                              {protocol.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="protocol-stats">
                            <div className="stat">
                              <span className="label">Current APY:</span>
                              <span className="value positive">
                                {protocol.yield}%
                              </span>
                            </div>
                            <div className="stat">
                              <span className="label">Risk Score:</span>
                              <span
                                className={`value ${
                                  protocol.risk < 30
                                    ? "low-risk"
                                    : protocol.risk < 70
                                    ? "medium-risk"
                                    : "high-risk"
                                }`}
                              >
                                {protocol.risk}/100
                              </span>
                            </div>
                            <div className="stat">
                              <span className="label">TVL:</span>
                              <span className="value">
                                ${protocol.tvl}M
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center">
                      <p>No protocols available at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="ai-recommendations">
                <div className="recommendation-card">
                  <div className="recommendation-header">
                    <FaRobot />
                    <h3>AI Agent Recommendations</h3>
                  </div>
                  <div className="recommendation-content">
                    <div className="recommendation-item">
                      <div className="recommendation-badge optimal">
                        Optimal
                      </div>
                      <h4>Yield Optimization Opportunity</h4>
                      <p>
                        Based on current market conditions, rebalancing to
                        Protocol A (8.5% APY) and Protocol C (7.2% APY) can
                        increase your yield by 2.3% while maintaining your risk
                        profile.
                      </p>
                      <button className="thm-btn mt-10">
                        Execute Optimization
                      </button>
                    </div>

                    <div className="recommendation-item">
                      <div className="recommendation-badge moderate">
                        Moderate Risk
                      </div>
                      <h4>High-Yield Option Available</h4>
                      <p>
                        New protocol D is offering 12% APY. Risk score: 65/100.
                        Consider allocating 20% of your portfolio for
                        diversified higher returns.
                      </p>
                      <button className="thm-btn-outline mt-10">
                        Learn More
                      </button>
                    </div>

                    <div className="recommendation-item">
                      <div className="recommendation-badge safe">Safe</div>
                      <h4>Risk Reduction Suggestion</h4>
                      <p>
                        Your current risk score is 45/100. Moving 30% to
                        Protocol B (risk: 15) can lower your overall risk to
                        35/100 with only 0.5% yield reduction.
                      </p>
                      <button className="thm-btn-outline mt-10">
                        Review Strategy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .agent-dashboard {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }

        .wallet-info {
          margin-top: 15px;
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          font-weight: 600;
        }

        .dashboard-stats {
          margin-top: 40px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 30px;
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          background: rgba(255, 255, 255, 0.15);
        }

        .stat-icon {
          font-size: 40px;
          color: #ffd700;
        }

        .stat-info h4 {
          font-size: 28px;
          margin: 0;
          font-weight: 700;
        }

        .stat-info p {
          margin: 5px 0 0;
          opacity: 0.8;
        }

        .dashboard-tabs {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 30px;
        }

        .tab-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tab-buttons button {
          padding: 12px 30px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .tab-buttons button.active {
          background: #ffd700;
          color: #000;
        }

        .tab-buttons button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .info-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 20px;
        }

        .info-card h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 22px;
        }

        .chart-item {
          display: flex;
          justify-content: space-between;
          padding: 15px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chart-item:last-child {
          border-bottom: none;
        }

        .value.positive {
          color: #4ade80;
          font-weight: 700;
        }

        .value.negative {
          color: #ef4444;
          font-weight: 700;
        }

        .positions-table {
          overflow-x: auto;
        }

        .positions-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .positions-table th,
        .positions-table td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .positions-table th {
          background: rgba(255, 255, 255, 0.1);
          font-weight: 700;
        }

        .btn-small {
          padding: 8px 20px;
          background: #ffd700;
          color: #000;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-small:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .transactions-header {
          margin-bottom: 20px;
        }

        .transactions-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .transactions-list {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          padding: 20px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .transaction-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tx-icon {
          width: 50px;
          height: 50px;
          background: rgba(255, 215, 0, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
        }

        .tx-details {
          flex: 1;
        }

        .tx-details h4 {
          margin: 0 0 5px 0;
          font-size: 18px;
        }

        .tx-details p {
          margin: 3px 0;
          opacity: 0.7;
          font-size: 14px;
        }

        .tx-time {
          font-size: 12px;
          opacity: 0.5;
        }

        .tx-amount {
          text-align: right;
        }

        .tx-amount span {
          display: block;
          margin: 5px 0;
        }

        .status {
          padding: 3px 10px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 600;
        }

        .status.completed {
          background: #4ade80;
          color: #000;
        }

        .status.pending {
          background: #fbbf24;
          color: #000;
        }

        .status.failed {
          background: #ef4444;
          color: #fff;
        }

        .tx-link {
          color: #ffd700;
          font-size: 18px;
          transition: all 0.3s ease;
        }

        .tx-link:hover {
          color: #fff;
          transform: scale(1.2);
        }

        .protocol-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 20px;
        }

        .protocol-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .status {
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status.active {
          background: #4ade80;
          color: #000;
        }

        .status.inactive {
          background: #ef4444;
        }

        .protocol-stats .stat {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
        }

        .low-risk {
          color: #4ade80;
        }

        .medium-risk {
          color: #fbbf24;
        }

        .high-risk {
          color: #ef4444;
        }

        .recommendation-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 30px;
        }

        .recommendation-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
          font-size: 24px;
        }

        .recommendation-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 25px;
          margin-bottom: 20px;
          position: relative;
        }

        .recommendation-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .recommendation-badge.optimal {
          background: #4ade80;
          color: #000;
        }

        .recommendation-badge.moderate {
          background: #fbbf24;
          color: #000;
        }

        .recommendation-badge.safe {
          background: #60a5fa;
          color: #000;
        }

        .recommendation-item h4 {
          margin: 20px 0 10px;
        }

        .thm-btn,
        .thm-btn-outline {
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .thm-btn {
          background: #ffd700;
          color: #000;
          border: none;
        }

        .thm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .thm-btn-outline {
          background: transparent;
          color: #fff;
          border: 2px solid #fff;
        }

        .thm-btn:hover:not(:disabled) {
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .stat-card {
            flex-direction: column;
            text-align: center;
          }

          .tab-buttons {
            flex-direction: column;
          }

          .tab-buttons button {
            width: 100%;
          }

          .transaction-item {
            flex-direction: column;
            text-align: center;
          }

          .tx-amount {
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
};

export default AgentDashboard;
