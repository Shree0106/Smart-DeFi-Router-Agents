import React, { useState, useEffect, useContext } from "react";
import { FaRobot, FaCalculator, FaChartLine } from "react-icons/fa";
import { IoMdCheckmarkCircle } from "react-icons/io";
import { TOKEN_ICO_Context } from "../context/index";

const RouteOptimizer = ({ setLoader, voiceCommand }) => {
  const {
    account,
    CALCULATE_OPTIMAL_ROUTE,
    EXECUTE_ROUTE,
    // Python backend functions
    CHECK_BACKEND_HEALTH,
    CALCULATE_OPTIMAL_ROUTE_VIA_API,
    CHECK_ALLOWANCE_VIA_API,
  } = useContext(TOKEN_ICO_Context);
  const [amount, setAmount] = useState("");
  const [targetYield, setTargetYield] = useState(5);
  const [maxRisk, setMaxRisk] = useState(50);
  const [duration, setDuration] = useState(30);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5);
  const [calculatedRoute, setCalculatedRoute] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showVoiceNotification, setShowVoiceNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // Check if backend is available on mount
  const [backendAvailable, setBackendAvailable] = useState(false);

  // Listen for voice commands and auto-fill form
  useEffect(() => {
    if (voiceCommand && voiceCommand.action === 'invest') {
      console.log('Voice command received in RouteOptimizer:', voiceCommand);
      
      // Auto-fill form with voice command data - only update if value is provided
      if (voiceCommand.amount !== null && voiceCommand.amount !== undefined) {
        setAmount(voiceCommand.amount.toString());
      }
      if (voiceCommand.targetYield !== null && voiceCommand.targetYield !== undefined) {
        setTargetYield(voiceCommand.targetYield);
      }
      if (voiceCommand.riskTolerance !== null && voiceCommand.riskTolerance !== undefined) {
        setMaxRisk(voiceCommand.riskTolerance);
      }
      if (voiceCommand.duration !== null && voiceCommand.duration !== undefined) {
        setDuration(voiceCommand.duration);
      }
      if (voiceCommand.autoRebalance !== undefined) {
        setAutoRebalance(voiceCommand.autoRebalance);
      }
      
      // Show notification
      setShowVoiceNotification(true);
      setTimeout(() => setShowVoiceNotification(false), 5000);
      
      // Auto-calculate the route
      setTimeout(() => {
        handleCalculate();
      }, 500);
    }
  }, [voiceCommand]);

  // Check backend health
  useEffect(() => {
    const checkBackend = async () => {
      if (CHECK_BACKEND_HEALTH) {
        const isHealthy = await CHECK_BACKEND_HEALTH();
        setBackendAvailable(isHealthy);
        if (isHealthy) {
          console.log("✅ Python backend is available - will use API for calculations");
        } else {
          console.log("⚠️ Python backend not available - will use client-side calculation");
        }
      }
    };
    checkBackend();
  }, [CHECK_BACKEND_HEALTH]);

  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      setErrorMessage(""); // Clear previous errors
      
      // Try Python backend first (no RPC errors!)
      if (backendAvailable && CALCULATE_OPTIMAL_ROUTE_VIA_API) {
        console.log("🐍 Using Python backend API (reliable!)");
        const route = await CALCULATE_OPTIMAL_ROUTE_VIA_API(
          parseFloat(amount),
          parseInt(maxRisk),
          parseFloat(targetYield),
          parseInt(duration)
        );
        setCalculatedRoute(route);
        setIsCalculating(false);
        return;
      }

      // Fallback to client-side calculation
      console.log("⚠️ Backend not available, using client-side calculation");
      const route = await CALCULATE_OPTIMAL_ROUTE(
        parseFloat(amount),
        parseInt(maxRisk),
        parseFloat(targetYield),
        parseInt(duration)
      );
      
      setCalculatedRoute(route);
      setIsCalculating(false);
    } catch (err) {
      console.error("Calculation error:", err);
      
      // Provide user-friendly error messages
      let errorMessage = err.message || "Unknown error";
      
      // Check for common error patterns and provide helpful guidance
      if (errorMessage.includes("No protocols match risk level")) {
        const riskMatch = errorMessage.match(/risk level (\d+)/);
        if (riskMatch) {
          const currentRisk = parseInt(riskMatch[1]);
          errorMessage = `No protocols found for risk level ${currentRisk}. Try adjusting your risk slider. Available risk levels typically range from 20 to 85.`;
        }
      } else if (errorMessage.includes("Cannot connect to Python backend")) {
        errorMessage = "Python backend is not running. Please start it with: cd python_backend && ./start_backend.sh";
      }
      
      setErrorMessage(errorMessage);
      setIsCalculating(false);
    }
  };

  const handleExecute = async () => {
    try {
      setLoader(true);

      if (!calculatedRoute) {
        alert("Please calculate route first");
        setLoader(false);
        return;
      }

      if (!account) {
        alert("Please connect your wallet first");
        setLoader(false);
        return;
      }

      // Show initial message
      console.log("🚀 Starting route execution...");
      console.log("📊 Route Details:", {
        protocols: calculatedRoute.protocols?.length || calculatedRoute.protocol_names?.length,
        amount: parseFloat(amount),
        expectedYield: calculatedRoute.totalExpectedYield || calculatedRoute.expected_yield,
      });
    
      // Execute route on smart contract
      // This will trigger MetaMask to show transaction details
      const result = await EXECUTE_ROUTE(calculatedRoute, parseFloat(amount));
      
      if (result.success) {
        // Show success message with transaction details
        let successMessage = "";
        
        if (result.demo) {
          // Demo mode message
          successMessage = result.message;
        } else {
          // Real transaction message
          successMessage = `✅ Route Executed Successfully!\n\n` +
            `Transaction Hash: ${result.hash}\n` +
            `${result.blockNumber ? `Block Number: ${result.blockNumber}\n` : ''}` +
            `${result.gasUsed ? `Gas Used: ${result.gasUsed}\n` : ''}` +
            `\n🔗 View on Explorer:\nhttps://testnet.arcscan.app/tx/${result.hash}\n\n` +
            `💰 Your ${amount} KRN has been optimally distributed across ${calculatedRoute.protocols?.length || calculatedRoute.protocol_names?.length} DeFi protocols!`;
        }
        
        alert(successMessage);
        
        // Clear the form
        setCalculatedRoute(null);
        setAmount("");
        
        setLoader(false);
      }
    } catch (error) {
      console.error("Error executing route:", error);
      
      let errorMessage = "Failed to execute route";
      if (error.message) {
        if (error.message.includes("insufficient")) {
          errorMessage = "❌ Insufficient USDC balance or allowance\n\n" +
            "Please ensure you have enough USDC in your wallet.";
        } else if (error.message.includes("user rejected") || error.message.includes("rejected")) {
          errorMessage = "⚠️ Transaction Rejected\n\n" +
            "You rejected the transaction in MetaMask. Please approve to continue.";
        } else if (error.message.includes("Approval verification failed")) {
          errorMessage = "⏳ Transaction Processing\n\n" +
            error.message + "\n\nPlease wait a moment and try clicking 'Execute Route' again.";
        } else {
          errorMessage = "❌ " + error.message;
        }
      }
      
      alert(errorMessage);
      setLoader(false);
    }
  };

  return (
    <section id="optimizer" className="route-optimizer pos-rel pt-140 pb-105">
      <div className="container">
        <div className="sec-title text-center mb-50">
          <h5 className="sec-title__subtitle">
            <FaRobot /> AI-Powered Optimization
          </h5>
          <h2 className="sec-title__title">Smart Route Optimizer</h2>
          <p className="sec-title__text">
            Tell us your goals, and our AI will calculate the optimal DeFi
            route for your KRN
          </p>
        </div>

        <div className="optimizer-container">
          {/* Voice Command Notification */}
          {showVoiceNotification && (
            <div className="voice-notification">
              <FaRobot className="voice-icon-pulse" />
              <div className="voice-notification-content">
                <h4>🎤 Voice Command Detected!</h4>
                <p>Form has been auto-filled with your voice input. Review and click "Calculate Route" to proceed.</p>
              </div>
            </div>
          )}

          <div className="row">
            {/* Input Form */}
            <div className="col-lg-6">
              <div className="optimizer-form">
                <h3>
                  <FaCalculator /> Configure Your Strategy
                </h3>

                <div className="form-group">
                  <label>KRN Amount</label>
                  <input
                    type="number"
                    placeholder="Enter amount (e.g., 1000)"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrorMessage(""); // Clear error when user types
                    }}
                    className="form-input"
                  />
                  {errorMessage && (
                    <div className="error-message">
                      {errorMessage}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Target Minimum Yield (%)</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.1"
                      value={targetYield}
                      onChange={(e) => setTargetYield(e.target.value)}
                      className="slider"
                    />
                    <span className="slider-value">{targetYield}% APY</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Maximum Risk Tolerance</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={maxRisk}
                      onChange={(e) => setMaxRisk(e.target.value)}
                      className="slider"
                    />
                    <span
                      className={`slider-value ${
                        maxRisk < 30
                          ? "low-risk"
                          : maxRisk < 70
                          ? "medium-risk"
                          : "high-risk"
                      }`}
                    >
                      {maxRisk}/100 (
                      {maxRisk < 30 ? "Conservative" : maxRisk < 70 ? "Moderate" : "Aggressive"}
                      )
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Investment Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="form-select"
                  >
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="180">6 Months</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="autoRebalance"
                      checked={autoRebalance}
                      onChange={(e) => setAutoRebalance(e.target.checked)}
                    />
                    <label htmlFor="autoRebalance">
                      Enable Auto-Rebalancing
                    </label>
                  </div>
                  <p className="help-text">
                    Automatically rebalance when yield drops by threshold
                  </p>
                </div>

                {autoRebalance && (
                  <div className="form-group">
                    <label>Rebalance Threshold (%)</label>
                    <div className="slider-container">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={rebalanceThreshold}
                        onChange={(e) => setRebalanceThreshold(e.target.value)}
                        className="slider"
                      />
                      <span className="slider-value">
                        {rebalanceThreshold}% yield drop
                      </span>
                    </div>
                  </div>
                )}

                <button
                  className="thm-btn btn-full"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>
                      <span className="spinner"></span> AI Calculating...
                    </>
                  ) : (
                    <>
                      <FaRobot /> Calculate Optimal Route
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Display */}
            <div className="col-lg-6">
              <div className="optimizer-results">
                {!calculatedRoute ? (
                  <div className="empty-state">
                    <FaChartLine />
                    <h3>Ready for Optimization</h3>
                    <p>
                      Configure your strategy on the left and click "Calculate"
                      to see AI-optimized routes
                    </p>
                  </div>
                ) : (
                  <div className="results-content">
                    <div className="results-header">
                      <IoMdCheckmarkCircle />
                      <h3>Optimal Route Calculated</h3>
                      {calculatedRoute.ai_optimized && (
                        <span className="ai-badge">🤖 Gemini AI</span>
                      )}
                    </div>

                    <div className="results-summary">
                      <div className="summary-item">
                        <span className="label">Expected Yield:</span>
                        <span className="value positive">
                          {calculatedRoute.expected_yield || calculatedRoute.totalExpectedYield}% APY
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="label">Average Risk:</span>
                        <span
                          className={`value ${
                            (calculatedRoute.risk_score || calculatedRoute.averageRisk) < 30
                              ? "low-risk"
                              : (calculatedRoute.risk_score || calculatedRoute.averageRisk) < 70
                              ? "medium-risk"
                              : "high-risk"
                          }`}
                        >
                          {calculatedRoute.risk_score || calculatedRoute.averageRisk}/100
                        </span>
                      </div>
                      {calculatedRoute.gasEstimate && (
                        <div className="summary-item">
                          <span className="label">Gas Fee:</span>
                          <span className="value">{calculatedRoute.gasEstimate}</span>
                        </div>
                      )}
                      {calculatedRoute.executionTime && (
                        <div className="summary-item">
                          <span className="label">Execution Time:</span>
                          <span className="value">{calculatedRoute.executionTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="protocol-allocation">
                      <h4>Protocol Allocation</h4>
                      {(calculatedRoute.protocol_names || calculatedRoute.protocols).map((protocolName, index) => {
                        const name = calculatedRoute.protocol_names ? protocolName : calculatedRoute.protocols[index]?.name || `Protocol ${index + 1}`;
                        const allocation = calculatedRoute.amounts 
                          ? (parseFloat(calculatedRoute.amounts[index]) / parseFloat(amount)) * 100
                          : calculatedRoute.protocols[index]?.allocation || 0;
                        const apy = calculatedRoute.yields 
                          ? calculatedRoute.yields[index]
                          : calculatedRoute.protocols[index]?.apy || 0;
                        const risk = calculatedRoute.risks
                          ? calculatedRoute.risks[index]
                          : calculatedRoute.protocols[index]?.risk || 0;
                        const protocolAmount = calculatedRoute.amounts
                          ? parseFloat(calculatedRoute.amounts[index])
                          : ((parseFloat(amount) * allocation) / 100);

                        return (
                          <div key={index} className="allocation-item">
                            <div className="allocation-header">
                              <span className="protocol-name">{name}</span>
                              <span className="allocation-percent">
                                {allocation.toFixed(1)}%
                              </span>
                            </div>
                            <div className="allocation-bar">
                              <div
                                className="allocation-fill"
                                style={{ width: `${allocation}%` }}
                              ></div>
                            </div>
                            <div className="allocation-details">
                              <span>APY: {apy}%</span>
                              <span>Risk: {risk}/100</span>
                              <span>Amount: {protocolAmount.toFixed(2)} KRN</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="estimated-returns">
                      <h4>Estimated Returns</h4>
                      <div className="returns-breakdown">
                        <div className="return-item">
                          <span className="period">Daily</span>
                          <span className="amount">
                            +{((parseFloat(amount) * (calculatedRoute.expected_yield || calculatedRoute.expectedYield || 0) / 100) / 365).toFixed(2)} KRN
                          </span>
                        </div>
                        <div className="return-item">
                          <span className="period">Monthly</span>
                          <span className="amount">
                            +{((parseFloat(amount) * (calculatedRoute.expected_yield || calculatedRoute.expectedYield || 0) / 100) / 12).toFixed(2)} KRN
                          </span>
                        </div>
                        <div className="return-item">
                          <span className="period">Yearly</span>
                          <span className="amount">
                            +{(parseFloat(amount) * (calculatedRoute.expected_yield || calculatedRoute.expectedYield || 0) / 100).toFixed(2)} KRN
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="thm-btn btn-full" onClick={handleExecute}>
                      <IoMdCheckmarkCircle /> Execute Route
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .route-optimizer {
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: #fff;
        }

        .optimizer-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .optimizer-form,
        .optimizer-results {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          min-height: 600px;
        }

        .optimizer-form h3,
        .optimizer-results h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 30px;
          font-size: 24px;
        }

        .form-group {
          margin-bottom: 25px;
        }

        .form-group label {
          display: block;
          margin-bottom: 10px;
          font-weight: 600;
          font-size: 14px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 15px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 10px;
          font-size: 16px;
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .slider-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .slider {
          flex: 1;
          height: 8px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.2);
          outline: none;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffd700;
          cursor: pointer;
        }

        .slider-value {
          min-width: 120px;
          text-align: right;
          font-weight: 700;
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

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .checkbox-group input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .help-text {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 5px;
        }

        .error-message {
          margin-top: 10px;
          padding: 12px 15px;
          background: rgba(239, 68, 68, 0.2);
          border-left: 4px solid #ef4444;
          border-radius: 8px;
          color: #fecaca;
          font-size: 14px;
          font-weight: 500;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .thm-btn {
          width: 100%;
          padding: 15px 30px;
          background: #ffd700;
          color: #000;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        .thm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(255, 215, 0, 0.3);
        }

        .thm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #000;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          opacity: 0.6;
        }

        .empty-state svg {
          font-size: 80px;
          margin-bottom: 20px;
        }

        .results-content {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .results-header svg {
          font-size: 30px;
          color: #4ade80;
        }

        .ai-badge {
          margin-left: auto;
          padding: 6px 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          animation: pulse 2s infinite;
        }

        .results-summary {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 20px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .summary-item:last-child {
          border-bottom: none;
        }

        .value.positive {
          color: #4ade80;
          font-weight: 700;
        }

        .protocol-allocation h4,
        .estimated-returns h4 {
          margin-bottom: 15px;
          font-size: 18px;
        }

        .allocation-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .allocation-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .allocation-bar {
          height: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .allocation-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
          transition: width 0.5s ease;
        }

        .allocation-details {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          opacity: 0.8;
        }

        .returns-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }

        .return-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 15px;
          text-align: center;
        }

        .return-item .period {
          display: block;
          font-size: 12px;
          opacity: 0.7;
          margin-bottom: 5px;
        }

        .return-item .amount {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #4ade80;
        }

        .voice-notification {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 15px;
          padding: 20px 25px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 20px;
          animation: slideInDown 0.5s ease;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        @keyframes slideInDown {
          from {
            transform: translateY(-30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .voice-icon-pulse {
          font-size: 40px;
          color: #ffd700;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .voice-notification-content h4 {
          color: #fff;
          font-size: 18px;
          margin: 0 0 5px 0;
          font-weight: 700;
        }

        .voice-notification-content p {
          color: #e0e0e0;
          font-size: 14px;
          margin: 0;
        }

        @media (max-width: 992px) {
          .optimizer-form,
          .optimizer-results {
            margin-bottom: 20px;
          }

          .returns-grid {
            grid-template-columns: 1fr;
          }

          .voice-notification {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
};

export default RouteOptimizer;
