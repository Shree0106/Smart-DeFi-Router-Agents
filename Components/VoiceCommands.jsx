import React, { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaStop, FaVolumeUp } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { MdKeyboardVoice } from "react-icons/md";

const VoiceCommands = ({ onCommandExecuted }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState("");
  const [parsedCommand, setParsedCommand] = useState(null);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        processCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = '';
        switch(event.error) {
          case 'not-allowed':
            errorMessage = '🎤 Microphone Access Denied! Please allow microphone permissions in your browser. Click the lock icon in the address bar and enable microphone access, then refresh the page.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again and speak clearly.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please connect a microphone and try again.';
            break;
          case 'network':
            errorMessage = 'Network error occurred. Please check your connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          default:
            errorMessage = `Voice recognition error: ${event.error}. Please check your browser settings.`;
        }
        
        setError(errorMessage);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startListening = async () => {
    setError("");
    setTranscript("");
    setResponse("");
    
    // Check for microphone permissions first
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissionStatus.state === 'denied') {
          setError('🎤 Microphone Access Blocked! Please enable microphone permissions:\n\n1. Click the lock icon in your browser address bar\n2. Find "Microphone" and change to "Allow"\n3. Refresh the page and try again');
          setShowPopup(true);
          return;
        }
      } catch (err) {
        console.log('Permission check not supported, proceeding...');
      }
    }
    
    if (recognitionRef.current) {
      setIsListening(true);
      setShowPopup(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start voice recognition. Please refresh the page and try again.');
        setIsListening(false);
      }
    } else {
      setError("Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
      setShowPopup(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processCommand = async (text) => {
    setIsProcessing(true);
    
    try {
      // Parse the natural language command
      const parsedCommand = parseNaturalLanguage(text);
      setParsedCommand(parsedCommand); // Store for display
      
      // Generate AI response
      const aiResponse = generateResponse(parsedCommand);
      setResponse(aiResponse);

      // Convert response to speech using ElevenLabs
      await speakResponse(aiResponse);

      // Execute the command if valid AND it's an actionable command (not greeting/help/etc)
      const actionableCommands = ['invest', 'withdraw', 'rebalance', 'status'];
      if (parsedCommand.valid && actionableCommands.includes(parsedCommand.action) && onCommandExecuted) {
        onCommandExecuted(parsedCommand);
      }

    } catch (err) {
      console.error('Error processing command:', err);
      setError('Failed to process command');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseNaturalLanguage = (text) => {
    const lowerText = text.toLowerCase();
    
    // Check for greetings and casual conversation first
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy', 'what\'s up', 'sup'];
    const questions = ['how are you', 'how do you do', 'what can you do', 'help', 'what is this', 'who are you'];
    
    // Check if it's a greeting
    for (const greeting of greetings) {
      if (lowerText.includes(greeting) && !lowerText.includes('invest') && !lowerText.includes('withdraw')) {
        return {
          valid: false,
          action: 'greeting',
          amount: null,
          duration: null,
          riskTolerance: null,
          targetYield: null,
          originalText: text
        };
      }
    }
    
    // Check if it's a question or help request
    for (const question of questions) {
      if (lowerText.includes(question)) {
        return {
          valid: false,
          action: 'help',
          amount: null,
          duration: null,
          riskTolerance: null,
          targetYield: null,
          originalText: text
        };
      }
    }
    
    // Check for goodbye/thanks
    if (lowerText.includes('thank') || lowerText.includes('thanks') || lowerText.includes('bye') || lowerText.includes('goodbye')) {
      return {
        valid: false,
        action: 'farewell',
        amount: null,
        duration: null,
        riskTolerance: null,
        targetYield: null,
        originalText: text
      };
    }
    
    // Extract amount
    const amountMatch = lowerText.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:usdc|dollars?|usd)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    // Extract duration - Enhanced to handle more formats
    const durationMatch = lowerText.match(/(?:for|duration|period|over|invest for)\s*(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
    let duration = null;
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      if (unit.includes('day')) duration = value;
      else if (unit.includes('week')) duration = value * 7;
      else if (unit.includes('month')) duration = value * 30;
      else if (unit.includes('year')) duration = value * 365;
    }
    // Fallback: Try to find standalone numbers with time units
    if (!duration) {
      const simpleDurationMatch = lowerText.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
      if (simpleDurationMatch) {
        const value = parseInt(simpleDurationMatch[1]);
        const unit = simpleDurationMatch[2].toLowerCase();
        if (unit.includes('day')) duration = value;
        else if (unit.includes('week')) duration = value * 7;
        else if (unit.includes('month')) duration = value * 30;
        else if (unit.includes('year')) duration = value * 365;
      }
    }

    // Extract risk tolerance - Enhanced with numeric and keyword detection
    let riskTolerance = null;
    
    // First, try to extract numeric risk value (0-100)
    const numericRiskMatch = lowerText.match(/(?:risk|risk\s+tolerance|risk\s+level)\s*(?:of|at|is)?\s*(\d+)(?:\s*%)?/i);
    if (numericRiskMatch) {
      riskTolerance = parseInt(numericRiskMatch[1]);
      // Ensure it's within 0-100 range
      riskTolerance = Math.max(0, Math.min(100, riskTolerance));
    }
    
    // If no numeric value, check for keywords
    if (riskTolerance === null) {
      if (lowerText.includes('very low risk') || lowerText.includes('ultra conservative') || lowerText.includes('minimal risk')) {
        riskTolerance = 10;
      } else if (lowerText.includes('low risk') || lowerText.includes('conservative') || lowerText.includes('safe')) {
        riskTolerance = 25;
      } else if (lowerText.includes('moderate') || lowerText.includes('medium') || lowerText.includes('balanced')) {
        riskTolerance = 50;
      } else if (lowerText.includes('high risk') || lowerText.includes('aggressive')) {
        riskTolerance = 75;
      } else if (lowerText.includes('very high risk') || lowerText.includes('ultra aggressive') || lowerText.includes('maximum risk')) {
        riskTolerance = 90;
      }
    }

    // Extract target yield/APY - Enhanced to handle more formats
    let targetYield = null;
    
    // Try to match APY/yield with percentage or numeric value
    const yieldMatch = lowerText.match(/(?:target|targeting|apy|yield|return|apr|interest)(?:\s+of)?\s*(\d+(?:\.\d+)?)\s*%?/i);
    if (yieldMatch) {
      targetYield = parseFloat(yieldMatch[1]);
    }
    
    // Fallback: Try to find standalone percentage values
    if (!targetYield) {
      const percentMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:apy|yield|return|apr)?/i);
      if (percentMatch) {
        targetYield = parseFloat(percentMatch[1]);
      }
    }

    // Determine action
    let action = null;
    
    // Check for specific actions
    if (lowerText.includes('withdraw') || lowerText.includes('pull out') || lowerText.includes('remove')) {
      action = 'withdraw';
    } else if (lowerText.includes('rebalance') || lowerText.includes('optimize')) {
      action = 'rebalance';
    } else if (lowerText.includes('status') || lowerText.includes('check') || lowerText.includes('show') || lowerText.includes('portfolio')) {
      action = 'status';
    } else if (lowerText.includes('invest') || lowerText.includes('deposit') || lowerText.includes('put') || amount !== null) {
      action = 'invest';
    }
    
    // If no action detected and no investment-related keywords, it's not a valid command
    if (!action) {
      return {
        valid: false,
        action: 'unknown',
        amount,
        duration,
        riskTolerance,
        targetYield,
        originalText: text
      };
    }

    return {
      valid: amount !== null || action !== 'invest',
      action,
      amount,
      duration,
      riskTolerance,
      targetYield,
      originalText: text
    };
  };

  const generateResponse = (command) => {
    const { action, amount, duration, riskTolerance, targetYield } = command;

    switch (action) {
      case 'greeting':
        const greetingResponses = [
          "Hello! I'm your Smart DeFi Router assistant. I can help you invest USDC across various DeFi protocols to maximize your yields. Try saying something like: 'Invest 1000 USDC for 30 days with moderate risk targeting 10% APY'",
          "Hi there! Ready to optimize your DeFi investments? Tell me how much you want to invest, for how long, your risk tolerance, and target APY!",
          "Hey! Welcome to Smart DeFi Router. I can help you find the best yield opportunities. What would you like to do today?"
        ];
        return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
      
      case 'help':
        return "I can help you with DeFi investments! Here's what you can do:\n\n" +
               "📊 INVEST: Say 'Invest [amount] USDC for [duration] with [risk level] targeting [APY]%'\n" +
               "💰 WITHDRAW: Say 'Withdraw [amount] USDC' or 'Withdraw all'\n" +
               "🔄 REBALANCE: Say 'Rebalance my portfolio'\n" +
               "📈 STATUS: Say 'Show my portfolio status'\n\n" +
               "Example: 'Invest 5000 USDC for 60 days with moderate risk targeting 12% APY'";
      
      case 'farewell':
        return "Thank you for using Smart DeFi Router! Your investments are in good hands. Come back anytime!";
      
      case 'unknown':
        return "I'm not sure what you'd like me to do. Try saying:\n" +
               "• 'Invest 1000 USDC for 30 days' to make an investment\n" +
               "• 'Show my status' to see your portfolio\n" +
               "• 'Help' to learn what I can do\n\n" +
               "What would you like to do?";
      
      case 'invest':
        // Only generate investment response if we have at least an amount
        if (amount === null) {
          return "I'd be happy to help you invest! Please tell me how much USDC you'd like to invest. " +
                 "For example, say: 'Invest 1000 USDC for 30 days with moderate risk targeting 10% APY'";
        }
        
        let response = "Got it! I'll invest";
        
        if (amount) {
          response += ` ${amount.toLocaleString()} USDC`;
        }
        
        if (duration) {
          response += ` for ${duration} days`;
        }
        
        if (riskTolerance !== null) {
          response += ` with a ${getRiskLevel(riskTolerance)} risk profile (${riskTolerance}/100)`;
        }
        
        if (targetYield) {
          response += `, targeting ${targetYield}% APY`;
        }
        
        response += ". Calculating the optimal route now...";
        return response;
      
      case 'withdraw':
        return `Understood. I'll withdraw ${amount ? `${amount.toLocaleString()} USDC` : 'all funds'} from your positions. Processing the withdrawal now...`;
      
      case 'rebalance':
        return `Sure! I'll analyze your current positions and rebalance to optimize your returns. This will take a moment...`;
      
      case 'status':
        return `Let me fetch your current portfolio status, including all positions, yields, and recommendations.`;
      
      default:
        return `I heard: "${command.originalText}". Could you please clarify? For example, say "Invest 1000 USDC for 30 days with 75 risk tolerance targeting 12% APY"`;
    }
  };

  const getRiskLevel = (risk) => {
    if (risk <= 30) return 'low';
    if (risk <= 70) return 'moderate';
    return 'high';
  };

  const speakResponse = async (text) => {
    const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
    
    if (!apiKey || apiKey === 'your_elevenlabs_api_key_here') {
      console.warn('ElevenLabs API key not configured. Skipping voice response.');
      return;
    }

    setIsSpeaking(true);

    try {
      const voiceId = process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        throw new Error('ElevenLabs API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioRef.current.play();

    } catch (err) {
      console.error('Error with text-to-speech:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Voice Button */}
      <div className="voice-button-container">
        <button 
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={isListening ? stopListening : startListening}
          title="Voice Commands"
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
        </button>
        {isListening && (
          <div className="listening-pulse"></div>
        )}
      </div>

      {/* Voice Command Popup */}
      {showPopup && (
        <div className="voice-popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="voice-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPopup(false)}>
              <IoMdClose />
            </button>

            <div className="voice-popup-header">
              <MdKeyboardVoice className="voice-icon" />
              <h3>Voice Commands</h3>
            </div>

            <div className="voice-popup-content">
              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}

              <div className="status-section">
                {isListening && (
                  <div className="listening-animation">
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <div className="wave"></div>
                    <p>Listening...</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="processing-animation">
                    <div className="spinner"></div>
                    <p>Processing your command...</p>
                  </div>
                )}

                {isSpeaking && (
                  <div className="speaking-animation">
                    <FaVolumeUp className="speaker-icon" />
                    <p>Speaking response...</p>
                  </div>
                )}
              </div>

              {transcript && (
                <div className="transcript-section">
                  <h4>You said:</h4>
                  <p className="transcript-text">"{transcript}"</p>
                </div>
              )}

              {response && (
                <div className="response-section">
                  <h4>AI Response:</h4>
                  <p className="response-text">{response}</p>
                  
                  {/* Show parsed command details only for actionable commands */}
                  {transcript && parsedCommand && parsedCommand.action === 'invest' && parsedCommand.amount && (
                    <div className="parsed-command">
                      <h4>📋 Detected Values:</h4>
                      <div className="command-details">
                        {parsedCommand.amount !== null && parsedCommand.amount !== undefined && (
                          <div className="detail-item">
                            <span className="detail-label">Amount:</span>
                            <span className="detail-value">{parsedCommand.amount.toLocaleString()} USDC</span>
                          </div>
                        )}
                        {parsedCommand.duration !== null && parsedCommand.duration !== undefined && (
                          <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{parsedCommand.duration} days</span>
                          </div>
                        )}
                        {parsedCommand.riskTolerance !== null && parsedCommand.riskTolerance !== undefined && (
                          <div className="detail-item">
                            <span className="detail-label">Risk Level:</span>
                            <span className="detail-value">
                              {getRiskLevel(parsedCommand.riskTolerance).toUpperCase()} ({parsedCommand.riskTolerance}/100)
                            </span>
                          </div>
                        )}
                        {parsedCommand.targetYield !== null && parsedCommand.targetYield !== undefined && (
                          <div className="detail-item">
                            <span className="detail-label">Target APY:</span>
                            <span className="detail-value">{parsedCommand.targetYield}%</span>
                          </div>
                        )}
                        {parsedCommand.action && (
                          <div className="detail-item">
                            <span className="detail-label">Action:</span>
                            <span className="detail-value action-badge">{parsedCommand.action}</span>
                          </div>
                        )}
                      </div>
                      <p className="confirmation-note">
                        ✅ Form will be auto-filled. Review and click "Calculate Route" to proceed.
                      </p>
                    </div>
                  )}
                  
                  {/* Show a friendly message for non-investment commands */}
                  {parsedCommand && ['greeting', 'help', 'farewell', 'unknown'].includes(parsedCommand.action) && (
                    <div className="conversational-note">
                      <p className="info-text">
                        {parsedCommand.action === 'greeting' && "👋 I'm here to help you invest!"}
                        {parsedCommand.action === 'help' && "💡 Let me know if you need any clarification!"}
                        {parsedCommand.action === 'farewell' && "👋 See you soon!"}
                        {parsedCommand.action === 'unknown' && "🤔 Try giving me investment details to get started."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isListening && !isProcessing && !isSpeaking && (
                <div className="examples-section">
                  <h4>Try saying:</h4>
                  <ul>
                    <li>"Hello" or "What can you do?"</li>
                    <li>"Invest 1,000 USDC for 30 days with moderate risk targeting 10% APY"</li>
                    <li>"Show me my portfolio status"</li>
                    <li>"Withdraw 500 USDC from my positions"</li>
                    <li>"Rebalance my portfolio for better yields"</li>
                  </ul>
                </div>
              )}

              <div className="action-buttons">
                {!isListening && !isProcessing ? (
                  <button className="start-btn" onClick={startListening}>
                    <FaMicrophone /> Start Listening
                  </button>
                ) : (
                  <button className="stop-btn" onClick={stopListening}>
                    <FaStop /> Stop
                  </button>
                )}

                {isSpeaking && (
                  <button className="mute-btn" onClick={stopSpeaking}>
                    <IoMdClose /> Stop Speaking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .voice-button-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 1000;
        }

        .voice-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .voice-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }

        .voice-button.listening {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          animation: pulse 1.5s infinite;
        }

        .listening-pulse {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.3);
          animation: pulse-ring 1.5s infinite;
          pointer-events: none;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .voice-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .voice-popup {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
          position: relative;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .close-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          color: #fff;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg);
        }

        .voice-popup-header {
          text-align: center;
          margin-bottom: 25px;
        }

        .voice-icon {
          font-size: 48px;
          color: #667eea;
          margin-bottom: 10px;
        }

        .voice-popup-header h3 {
          color: #fff;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .voice-popup-content {
          color: #e0e0e0;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid #ef4444;
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        }

        .error-message p {
          color: #fca5a5;
          margin: 0;
        }

        .status-section {
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .listening-animation {
          text-align: center;
        }

        .listening-animation .wave {
          display: inline-block;
          width: 8px;
          height: 30px;
          background: #667eea;
          margin: 0 3px;
          border-radius: 4px;
          animation: wave 1s infinite;
        }

        .listening-animation .wave:nth-child(2) {
          animation-delay: 0.1s;
        }

        .listening-animation .wave:nth-child(3) {
          animation-delay: 0.2s;
        }

        @keyframes wave {
          0%, 100% { height: 30px; }
          50% { height: 50px; }
        }

        .listening-animation p,
        .processing-animation p,
        .speaking-animation p {
          color: #fff;
          margin-top: 15px;
          font-weight: 600;
        }

        .processing-animation {
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .speaking-animation {
          text-align: center;
        }

        .speaker-icon {
          font-size: 48px;
          color: #667eea;
          animation: pulse 1.5s infinite;
        }

        .transcript-section,
        .response-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .transcript-section h4,
        .response-section h4 {
          color: #ffd700;
          font-size: 14px;
          margin: 0 0 10px 0;
          font-weight: 600;
        }

        .transcript-text,
        .response-text {
          color: #fff;
          margin: 0;
          line-height: 1.6;
        }

        .parsed-command {
          background: rgba(255, 215, 0, 0.1);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 10px;
          padding: 20px;
          margin-top: 20px;
        }

        .parsed-command h4 {
          color: #ffd700;
          font-size: 14px;
          margin: 0 0 15px 0;
          font-weight: 600;
        }

        .command-details {
          display: grid;
          gap: 10px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .detail-label {
          color: #d0d0d0;
          font-size: 13px;
          font-weight: 500;
        }

        .detail-value {
          color: #fff;
          font-size: 14px;
          font-weight: 700;
        }

        .action-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 5px 15px;
          border-radius: 20px;
          text-transform: uppercase;
          font-size: 12px;
        }

        .confirmation-note {
          color: #4ade80;
          font-size: 13px;
          margin: 15px 0 0 0;
          text-align: center;
          font-weight: 600;
        }

        .examples-section {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .examples-section h4 {
          color: #ffd700;
          font-size: 16px;
          margin: 0 0 15px 0;
        }

        .examples-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .examples-section li {
          color: #d0d0d0;
          padding: 8px 0;
          padding-left: 20px;
          position: relative;
          font-size: 14px;
        }

        .examples-section li::before {
          content: '💬';
          position: absolute;
          left: 0;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .start-btn,
        .stop-btn,
        .mute-btn {
          flex: 1;
          padding: 15px 25px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.3s ease;
        }

        .start-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }

        .start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }

        .stop-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff;
        }

        .stop-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
        }

        .mute-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .mute-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .voice-button-container {
            bottom: 20px;
            right: 20px;
          }

          .voice-button {
            width: 50px;
            height: 50px;
            font-size: 20px;
          }

          .voice-popup {
            padding: 20px;
            max-height: 90vh;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
};

export default VoiceCommands;
