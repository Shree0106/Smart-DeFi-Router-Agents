import React, { useState, useEffect, useContext } from "react";
import { TOKEN_ICO_Context } from "../context/index";

const Header = ({
  account,
  CONNECT_WALLET,
  setAccount,
  setLoader,
  setOwnerModel,
  shortenAddress,
  detail,
  currency,
  ownerModel,
}) => {
  const { ADD_NETWORK, SWITCH_TO_ARC_NETWORK } = useContext(TOKEN_ICO_Context);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkModalMessage, setNetworkModalMessage] = useState("");

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      setAccount(accounts[0] || null);
      if (!accounts[0]) {
        setWrongNetwork(false);
      }
    };

    const handleChainChanged = () => {
      // Reload page when chain changes
      window.location.reload();
    };

    if (typeof window.ethereum !== "undefined") {
      setIsMetaMaskInstalled(true);

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [setAccount]);

  const connectMetamask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        setLoader(true);
        const result = await CONNECT_WALLET();
        
        if (result) {
          // Check if we got detailed connection info or just address
          if (typeof result === 'object' && result.address) {
            setAccount(result.address);
            
            if (result.wrongNetwork) {
              setWrongNetwork(true);
              setNetworkModalMessage(
                `⚠️ Wrong Network Detected!\n\nYou're currently on Chain ID: ${result.currentChainId}\nPlease switch to ${result.networkName} (Chain ID: ${result.expectedChainId})\n\nClick "Switch to Arc Testnet" below to automatically add and switch to the correct network.`
              );
              setShowNetworkModal(true);
              
              // Automatically attempt to switch/add network after a short delay
              // This gives the user time to see the modal but makes the flow smoother
              setTimeout(() => {
                console.log("💡 Wrong network detected - prompting network switch");
              }, 1000);
            } else {
              setWrongNetwork(false);
            }
          } else if (typeof result === 'string') {
            // Legacy format - just address string
            setAccount(result);
            setWrongNetwork(false);
          }
        }
        
        setLoader(false);
      } catch (error) {
        console.log("Error connecting to Metamask:", error);
        setLoader(false);
      }
    } else {
      alert("⚠️ Please install MetaMask extension!");
      console.log("Please install Metamask extension!");
    }
  };

  const handleAddNetwork = async () => {
    try {
      setLoader(true);
      setShowNetworkModal(false); // Close modal immediately for better UX
      
      console.log("🔄 Attempting to switch/add Arc Testnet...");
      await SWITCH_TO_ARC_NETWORK();
      
      setWrongNetwork(false);
      console.log("✅ Successfully switched to Arc Testnet!");
      
      // Show success message
      alert("✅ Successfully switched to Arc Testnet! The page will reload to connect properly.");
      
      setLoader(false);
      
      // Reload page to refresh all contract connections
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to add/switch network:", error);
      setLoader(false);
      
      // More user-friendly error messages
      let errorMessage = error.message || "Unknown error occurred";
      
      if (errorMessage.includes("cancelled") || errorMessage.includes("rejected")) {
        alert("⚠️ Network switch was cancelled. Click the button again when you're ready to proceed.");
        setShowNetworkModal(true); // Reopen modal
      } else if (errorMessage.includes("not detected") || errorMessage.includes("not found")) {
        alert("⚠️ MetaMask not detected. Please make sure:\n\n• MetaMask is installed\n• MetaMask is unlocked\n• You're using a supported browser");
        setShowNetworkModal(true);
      } else if (errorMessage.includes("add Arc Testnet manually")) {
        // This error already has manual instructions
        alert(`❌ ${errorMessage}`);
        setShowNetworkModal(true);
      } else {
        alert(
          `❌ Failed to switch network\n\n${errorMessage}\n\n` +
          `To add Arc Testnet manually in MetaMask:\n` +
          `1. Open MetaMask\n` +
          `2. Click network dropdown\n` +
          `3. Click "Add Network"\n` +
          `4. Enter these details:\n` +
          `   • Network Name: Arc Testnet\n` +
          `   • Chain ID: 5042002\n` +
          `   • Currency: USDC\n` +
          `   • Decimals: 6\n` +
          `   • RPC: https://rpc.testnet.arc.network\n` +
          `   • Explorer: https://testnet.arcscan.app`
        );
        setShowNetworkModal(true);
      }
    }
  };

  const closeNetworkModal = () => {
    setShowNetworkModal(false);
  };

  return (
    <header className="site-header header--transparent ico-header">
      <div className="header__main-wrap flex ">
        <div className="container mxw_1640">
          <div className="header__main ul_li_between">
            <div className="header__left ul_li">
              <div className="header__logo">
                <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src="assets/img/logo/logo.svg" alt="Smart DeFi Router" srcSet="" />
                  <span style={{
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "20px",
                    background: "linear-gradient(135deg, #ffd700 0%, #667eea 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    display: "inline-block"
                  }}>
                    Smart DeFi Router
                  </span>
                </a>
              </div>
            </div>

            <div className="main-menu__wrap ul_li navbar navbar-expand-xl ">
              <nav className="main-menu collapse navbar-collapse ">
                <ul
                  style={{ display: "flex", flexDirection: "row", gap: "2rem" }}
                >
                  <li className="active has-mega-menu">
                    <a href="/">Home</a>
                  </li>
                  <li className="scrollspy-btn">
                    <a href="#about">About</a>
                  </li>
                  <li className="scrollspy-btn">
                    <a href="#features">Features</a>
                  </li>
                  <li className="scrollspy-btn">
                    <a href="#optimizer">AI Router</a>
                  </li>
                  <li className="scrollspy-btn">
                    <a href="#dashboard">Dashboard</a>
                  </li>
                  <li className="scrollspy-btn">
                    <a href="#faq">FAQ</a>
                  </li>
                  <li className="scrollspy-btn">
                    <a href="#contact">Contact</a>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="header__action ul_li">
              <div className="d-xl-none">
                <a
                  href="javascript:void(0);"
                  className="header__bar ham hamburger_menu"
                >
                  <div className="header__bar-icon">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </a>
              </div>

              {detail?.address && detail?.owner && 
               detail.address.toLowerCase() === detail.owner.toLowerCase() && (
                <div style={{ marginRight: "15px" }}>
                  <a
                    onClick={() => setOwnerModel(!ownerModel)}
                    style={{ 
                      cursor: "pointer",
                      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      color: "#fff",
                      fontWeight: "600",
                      display: "inline-block",
                      transition: "all 0.3s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 5px 15px rgba(239, 68, 68, 0.4)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    🔧 Admin
                  </a>
                </div>
              )}

              {account ? (
                <div className="header__account" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {wrongNetwork && (
                    <a
                      onClick={handleAddNetwork}
                      style={{ 
                        cursor: "pointer",
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        color: "#fff",
                        fontWeight: "600",
                        display: "inline-block",
                        transition: "all 0.3s ease",
                        animation: "pulse 2s infinite"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 5px 15px rgba(239, 68, 68, 0.4)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      ⚠️ Switch to Arc Testnet
                    </a>
                  )}
                  <a
                    onClick={() =>
                      navigator.clipboard.writeText(detail?.address)
                    }
                    style={{ 
                      cursor: "pointer",
                      background: wrongNetwork 
                        ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)" 
                        : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      padding: "10px 20px",
                      borderRadius: "8px",
                      color: "#fff",
                      fontWeight: "600",
                      display: "inline-block",
                      transition: "all 0.3s ease",
                      opacity: wrongNetwork ? "0.7" : "1"
                    }}
                    onMouseOver={(e) => {
                      if (!wrongNetwork) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 5px 15px rgba(102, 126, 234, 0.4)";
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {shortenAddress(detail?.address)}: {detail?.maticBal?.slice(0, 6)} {currency}
                  </a>
                </div>
              ) : (
                <div className="header__account">
                  <a
                    onClick={() => connectMetamask()}
                    style={{ 
                      cursor: "pointer",
                      background: "#ffd700",
                      color: "#000",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      display: "inline-block",
                      transition: "all 0.3s ease",
                      boxShadow: "0 2px 10px rgba(255, 215, 0, 0.3)"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 5px 20px rgba(255, 215, 0, 0.5)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(255, 215, 0, 0.3)";
                    }}
                  >
                    Connect Wallet
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Network Warning Modal */}
      {showNetworkModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(5px)"
          }}
          onClick={closeNetworkModal}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
              padding: "40px",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              border: "2px solid #ef4444",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeNetworkModal}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "24px",
                cursor: "pointer",
                padding: "5px 10px",
                borderRadius: "4px",
                transition: "background 0.3s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              ×
            </button>
            
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div
                style={{
                  fontSize: "60px",
                  marginBottom: "20px"
                }}
              >
                ⚠️
              </div>
              <h2
                style={{
                  color: "#ef4444",
                  fontSize: "24px",
                  fontWeight: "700",
                  marginBottom: "15px"
                }}
              >
                Wrong Network Detected
              </h2>
              <p
                style={{
                  color: "#a0a0a0",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-line"
                }}
              >
                {networkModalMessage}
              </p>
            </div>

            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              <button
                onClick={handleAddNetwork}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  padding: "14px 28px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.3)";
                }}
              >
                🔄 Switch to Arc Testnet
              </button>
              
              <button
                onClick={closeNetworkModal}
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#fff",
                  padding: "14px 28px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
              >
                Cancel
              </button>
            </div>

            <div
              style={{
                marginTop: "25px",
                padding: "15px",
                background: "rgba(16, 185, 129, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(16, 185, 129, 0.3)"
              }}
            >
              <p style={{ color: "#10b981", fontSize: "14px", margin: 0, lineHeight: "1.5" }}>
                💡 <strong>How it works:</strong>
              </p>
              <ul style={{ color: "#10b981", fontSize: "13px", marginTop: "10px", paddingLeft: "20px", lineHeight: "1.8" }}>
                <li>Click "Switch to Arc Testnet" button</li>
                <li>MetaMask will open with network details</li>
                <li>If Arc Testnet is not in your MetaMask, it will be automatically added</li>
                <li>Approve the network switch in MetaMask</li>
                <li>The page will reload and connect to Arc Testnet</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .header__main-wrap {
          background: rgba(26, 26, 26, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .main-menu ul li a {
          color: #fff !important;
          font-weight: 600;
          font-size: 15px;
          padding: 8px 0;
          position: relative;
          transition: all 0.3s ease;
        }

        .main-menu ul li a:hover {
          color: #ffd700 !important;
        }

        .main-menu ul li a::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #ffd700, #667eea);
          transition: width 0.3s ease;
        }

        .main-menu ul li a:hover::after,
        .main-menu ul li.active a::after {
          width: 100%;
        }

        .main-menu ul li.active a {
          color: #ffd700 !important;
        }

        .header__logo img {
          max-height: 50px;
          filter: brightness(1.2);
        }

        @media (max-width: 1200px) {
          .main-menu ul {
            flex-direction: column !important;
            gap: 1rem !important;
            padding: 20px;
          }

          .main-menu ul li a {
            display: block;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
          }

          .header__account a {
            font-size: 14px !important;
            padding: 10px 18px !important;
          }
        }

        @media (max-width: 768px) {
          .header__account a {
            font-size: 12px !important;
            padding: 8px 14px !important;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
