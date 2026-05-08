import React, { useEffect, useState, useContext } from "react";
import toast from "react-hot-toast";
import { TOKEN_ICO_Context } from "../context/index";

const Hero = ({
  detail,
  setBuyModel,
  account,
  CONNECT_WALLET,
  setAccount,
  setLoader,
  addTokenToMetamask,
}) => {
  const { SWITCH_TO_ARC_NETWORK } = useContext(TOKEN_ICO_Context);
  const notifySuccess = (msg) => toast.success(msg, { duration: 2000 });
  const notifyError = (msg) => toast.error(msg, { duration: 3000 });

  const connectWallet = async () => {
    setLoader(true);
    const result = await CONNECT_WALLET();

    if (result) {
      // Handle detailed connection result
      if (typeof result === 'object' && result.address) {
        setAccount(result.address);

        // If wrong network, automatically prompt to switch
        if (result.wrongNetwork) {
          notifyError(`Wrong network detected! Currently on Chain ID: ${result.currentChainId}`);

          setLoader(false); // Stop loader before showing confirm

          // Ask user if they want to switch
          const shouldSwitch = window.confirm(
            `⚠️ Wrong Network!\n\nYou're on Chain ID: ${result.currentChainId}\n` +
            `Need: ${result.networkName} (Chain ID: ${result.expectedChainId})\n\n` +
            `Click OK to automatically switch/add Arc Testnet to MetaMask.`
          );

          if (shouldSwitch) {
            setLoader(true); // Resume loader
            try {
              console.log("🔄 User confirmed network switch, attempting...");
              const switchResult = await SWITCH_TO_ARC_NETWORK();

              if (switchResult && switchResult.success) {
                notifySuccess("✅ Switched to Arc Testnet! Page will reload...");
                setLoader(false);
                setTimeout(() => window.location.reload(), 1500);
              }
            } catch (error) {
              console.error("Network switch error:", error);
              setLoader(false);

              // Show detailed error message
              const errorMsg = error.message || "Unknown error occurred";

              if (errorMsg.includes("cancelled") || errorMsg.includes("rejected")) {
                notifyError("⚠️ You cancelled the network switch. Please try connecting again.");
              } else if (errorMsg.includes("Already Exists in MetaMask")) {
                // Show the detailed deletion instructions
                alert(errorMsg);
              } else if (errorMsg.includes("already exists")) {
                alert(
                  "⚠️ Network Already Exists\n\n" +
                  "Arc Testnet is already in your MetaMask but couldn't be switched to.\n\n" +
                  "Please:\n" +
                  "1. Open MetaMask\n" +
                  "2. Click network dropdown\n" +
                  "3. Find 'Arc Testnet' (Chain ID: 5042002)\n" +
                  "4. Click the 3 dots → Delete\n" +
                  "5. Come back and connect again\n\n" +
                  "This will add it fresh with the correct settings."
                );
              } else if (errorMsg.includes("add the network manually") || errorMsg.includes("MetaMask couldn't add")) {
                alert(
                  "⚠️ Automatic Network Addition Failed\n\n" +
                  errorMsg + "\n\n" +
                  "To add manually:\n" +
                  "1. Open MetaMask → Networks → Add Network\n" +
                  "2. Enter:\n" +
                  "   • Network Name: Arc Testnet\n" +
                  "   • Chain ID: 5042002\n" +
                  "   • Currency: USDC (Decimals: 6)\n" +
                  "   • RPC: https://rpc.testnet.arc.network\n" +
                  "   • Explorer: https://testnet.arcscan.app\n" +
                  "3. Save and switch to Arc Testnet\n" +
                  "4. Refresh this page"
                );
              } else {
                notifyError(`Failed to switch network: ${errorMsg}`);
                console.log("💡 Tip: Check if Arc Testnet already exists in MetaMask");
              }
            }
          } else {
            setLoader(false);
            notifyError("Please connect on Arc Testnet to use this app");
          }
          return; // Exit early
        } else {
          notifySuccess("✅ Wallet connected successfully!");
        }
      } else if (typeof result === 'string') {
        // Legacy format - just address string
        setAccount(result);
        notifySuccess("✅ Wallet connected successfully!");
      }
    }

    setLoader(false);
  };

  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const calculatePercentage = () => {
      if (!detail) return;

      const soldToken = detail?.tokenSold ?? 0;
      const tokenBalance = Number(detail?.tokenBal) ?? 0;
      const tokenTotalSupply = soldToken + tokenBalance;

      if (tokenTotalSupply === 0) {
        console.log("Token total supply is zero, cannot calculate percentage.");
        setPercentage(0);
      } else {
        const percent = (soldToken / tokenTotalSupply) * 100;
        setPercentage(percent.toFixed(2));
      }
    };

    calculatePercentage();
    const timer = setInterval(calculatePercentage, 1000);
    return () => clearInterval(timer);
  }, [detail]);

  return (
    <section
      className="hero hero__ico pos-rel"
      style={{
        backgroundImage: "url('assets/img/bg/blockchain_hero_bg.png')",
      }}
    >
      <div className="hero__shape">
        <span className="shape shape--1">
          <img src="assets/img/shape/h_shape.png" alt="" />
        </span>
        <span className="shape shape--2">
          <img src="assets/img/shape/h_shape2.png" alt="" />
        </span>
        <span className="shape shape--3">
          <img src="assets/img/shape/h_shape3.png" alt="" />
        </span>
      </div>

      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7">
            <div className="hero__content">
              <h1 className="title mb-45">
                <span>Smart DeFi Router Agent</span> Powered by AI + Arc + USDC
              </h1>
              <p className="mb-30">
                Maximize your USDC yields with AI-driven optimization across Arc's DeFi ecosystem.
                Our intelligent agent analyzes thousands of routes in seconds to find you the best
                risk-adjusted returns with minimal fees.
              </p>
              <div className="btns">
                {account ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setBuyModel(true);
                      window.location.hash = "#optimizer";
                    }}
                    className="thm-btn"
                    style={{ cursor: "pointer" }}
                  >
                    Start Optimizing
                  </a>
                ) : (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      connectWallet();
                    }}
                    className="thm-btn"
                    style={{ cursor: "pointer" }}
                  >
                    Connect Wallet
                  </a>
                )}
                <a
                  href="#optimizer"
                  className="thm-btn thm-btn--dark ml-20"
                  style={{ cursor: "pointer" }}
                >
                  Try AI Router
                </a>
              </div>
            </div>
          </div>

          {/* <div className="col-lg-6">
            <div className="hero__explore-wrap text-center">
              <div className="hero__explore text-center pos-rel">
                <div className="hero__circle-1"></div>
                <div className="hero__circle-2"></div>
                <div className="hero__circle-3"></div>
                <div className="hero__circle-4"></div>
                <div className="hero__explore-content">
                  <h4>{detail?.tokenSold || 0} Tokens Sold</h4>
                  <p className="mb-0">{percentage || 0}% Complete</p>
                  <div className="progress-wrap mt-20">
                    <div className="progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: `${percentage || 0}%` }}
                        aria-valuenow={percentage || 0}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  <div className="hero__explore-info mt-30">
                    <div className="hero__explore-info-item">
                      <h6>Total Supply</h6>
                      <p>
                        {detail?.tokenBal
                          ? Number(detail.tokenBal) + (detail?.tokenSold || 0)
                          : 0}
                      </p>
                    </div>
                    <div className="hero__explore-info-item">
                      <h6>Token Price</h6>
                      <p>{detail?.tokenPrice || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          <div className="hero__progress mt-50">
            <div className="progress-title ul_li_between">
              <span>
                <span>Total Value Locked -</span> {detail?.tokenSold || "0"} USDC
              </span>
              <span>
                <span>Active Users -</span> {Math.floor((detail?.tokenSold || 0) / 1000) || "0"}
              </span>
            </div>
            <div className="progress">
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${percentage || 0}%` }}
                aria-valuenow={percentage || 0}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>

            <ul className="ul_li_between">
              <li>AI Optimization</li>
              <li>Arc Speed</li>
              <li>USDC Stability</li>
            </ul>
          </div>

          <div className="col-lg-5">
            <div className="hero__explore-wrap text-center">
              <div className="hero__explore text-center">
                <div className="scroll-down">
                  <span>Explore Features</span>
                </div>
              </div>
              <div className="hero__countdown">
                <h6 className="text-center">
                  Average APY Across Protocols
                  <span className="hero__countdown-time">8.5%</span>
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero__shape">
        <div className="shape shape--1">
          <img src="assets/img/shape/s_shape1.png" alt="" />
        </div>
        <div className="shape shape--2">
          <img src="assets/img/shape/s_shape2.png" alt="" />
        </div>
        <div className="shape shape--3">
          <img src="assets/img/shape/h_shape3.png" alt="" />
        </div>
      </div>
      {/* Icon section */}
      <div className="hero__coin">
        <div className="coin coin--1">
          <img src="assets/img/icon/coin1.png" alt="" />
        </div>
        <div className="coin coin--2">
          <img src="assets/img/icon/coin2.png" alt="" />
        </div>
        <div className="coin coin--3">
          <img src="assets/img/icon/coin3.png" alt="" />
        </div>
        <div className="coin coin--4">
          <img src="assets/img/icon/coin4.png" alt="" />
        </div>
        <div className="coin coin--5">
          <img src="assets/img/icon/coin5.png" alt="" />
        </div>{" "}
        <div className="coin coin--6">
          <img src="assets/img/icon/coin6.png" alt="" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
