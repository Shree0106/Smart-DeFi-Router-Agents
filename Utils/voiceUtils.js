/**
 * Voice Utilities for Natural Language Processing
 * Handles command parsing, validation, and execution
 */

/**
 * Parse natural language investment commands
 * @param {string} text - The spoken command text
 * @returns {Object} Parsed command parameters
 */
export const parseInvestmentCommand = (text) => {
  const lowerText = text.toLowerCase();
  
  // Extract amount with various formats
  const amountPatterns = [
    /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:usdc|dollars?|usd|bucks)/i,
    /invest\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    /put\s+(\d+(?:,\d+)*(?:\.\d+)?)/i,
    /deposit\s+(\d+(?:,\d+)*(?:\.\d+)?)/i
  ];
  
  let amount = null;
  for (const pattern of amountPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
      break;
    }
  }

  // Extract duration
  const duration = extractDuration(lowerText);

  // Extract risk tolerance
  const riskTolerance = extractRiskTolerance(lowerText);

  // Extract target yield
  const targetYield = extractTargetYield(lowerText);

  // Determine action type
  const action = determineAction(lowerText);

  // Auto-rebalancing preference
  const autoRebalance = lowerText.includes('auto') || 
                        lowerText.includes('automatic') || 
                        lowerText.includes('rebalance');

  return {
    valid: amount !== null || action !== 'invest',
    action,
    amount,
    duration,
    riskTolerance,
    targetYield,
    autoRebalance,
    originalText: text,
    confidence: calculateConfidence(text, action, amount)
  };
};

/**
 * Extract duration from text in days
 */
const extractDuration = (text) => {
  const patterns = [
    { regex: /(\d+)\s*days?/i, multiplier: 1 },
    { regex: /(\d+)\s*weeks?/i, multiplier: 7 },
    { regex: /(\d+)\s*months?/i, multiplier: 30 },
    { regex: /(\d+)\s*years?/i, multiplier: 365 }
  ];

  for (const { regex, multiplier } of patterns) {
    const match = text.match(regex);
    if (match) {
      return parseInt(match[1]) * multiplier;
    }
  }

  // Default duration if not specified
  return 30;
};

/**
 * Extract risk tolerance (1-100 scale)
 */
const extractRiskTolerance = (text) => {
  const riskKeywords = {
    low: ['low', 'safe', 'conservative', 'careful', 'minimal', 'low risk'],
    moderate: ['moderate', 'medium', 'balanced', 'normal', 'moderate risk'],
    high: ['high', 'aggressive', 'risky', 'maximum', 'high risk', 'bold']
  };

  for (const [level, keywords] of Object.entries(riskKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      switch (level) {
        case 'low': return 20;
        case 'moderate': return 50;
        case 'high': return 80;
      }
    }
  }

  // Check for explicit percentage
  const percentMatch = text.match(/(\d+)\s*%?\s*risk/i);
  if (percentMatch) {
    return Math.min(100, Math.max(1, parseInt(percentMatch[1])));
  }

  return 50; // Default to moderate
};

/**
 * Extract target yield percentage
 */
const extractTargetYield = (text) => {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*%?\s*(?:apy|yield|return|interest)/i,
    /target(?:ing)?\s+(\d+(?:\.\d+)?)/i,
    /earn(?:ing)?\s+(\d+(?:\.\d+)?)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }

  return 8; // Default 8% APY target
};

/**
 * Determine the action type from command
 */
const determineAction = (text) => {
  const actionKeywords = {
    invest: ['invest', 'deposit', 'put', 'place', 'allocate', 'add'],
    withdraw: ['withdraw', 'pull', 'remove', 'take out', 'exit'],
    rebalance: ['rebalance', 'optimize', 'adjust', 'redistribute'],
    status: ['status', 'check', 'show', 'display', 'view', 'how much', 'balance']
  };

  for (const [action, keywords] of Object.entries(actionKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return action;
    }
  }

  return 'invest'; // Default action
};

/**
 * Calculate confidence score for parsed command
 */
const calculateConfidence = (text, action, amount) => {
  let score = 0;

  // Check for clear command structure
  if (amount !== null) score += 0.3;
  if (text.match(/\d+\s*(day|week|month|year)/i)) score += 0.2;
  if (text.match(/(low|moderate|high|safe|aggressive)\s*risk/i)) score += 0.2;
  if (text.match(/\d+(?:\.\d+)?\s*%?\s*(?:apy|yield)/i)) score += 0.15;
  if (['invest', 'withdraw', 'rebalance', 'status'].includes(action)) score += 0.15;

  return Math.min(1, score);
};

/**
 * Generate human-friendly response for command
 */
export const generateCommandResponse = (command) => {
  const { action, amount, duration, riskTolerance, targetYield, confidence } = command;

  if (confidence < 0.5) {
    return {
      success: false,
      message: `I'm not fully confident I understood your command. ${getSuggestion()}`,
      needsClarification: true
    };
  }

  switch (action) {
    case 'invest':
      return {
        success: true,
        message: `Perfect! I'll invest ${formatAmount(amount)} for ${duration} days with ${getRiskLevel(riskTolerance)} risk, targeting ${targetYield}% APY. Let me calculate the optimal route across our DeFi protocols.`,
        parameters: { amount, duration, riskTolerance, targetYield }
      };
    
    case 'withdraw':
      return {
        success: true,
        message: amount 
          ? `Understood. I'll withdraw ${formatAmount(amount)} from your positions and return it to your wallet. Processing now...`
          : `I'll withdraw all your funds from active positions. This may take a moment to process all protocols.`,
        parameters: { amount: amount || 'all' }
      };
    
    case 'rebalance':
      return {
        success: true,
        message: `Great! I'll analyze your current positions and rebalance them to maximize your returns while staying within your risk parameters. This should improve your yields.`,
        parameters: { riskTolerance, targetYield }
      };
    
    case 'status':
      return {
        success: true,
        message: `Let me pull up your portfolio status. I'll show you all your active positions, current yields, total value, and any AI recommendations for optimization.`,
        parameters: {}
      };
    
    default:
      return {
        success: false,
        message: `I didn't quite catch that. ${getSuggestion()}`,
        needsClarification: true
      };
  }
};

/**
 * Helper functions
 */
const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace('$', '') + ' USDC';
};

const getRiskLevel = (risk) => {
  if (risk <= 30) return 'low';
  if (risk <= 70) return 'moderate';
  return 'high';
};

const getSuggestion = () => {
  const examples = [
    "Try: 'Invest 1000 USDC for 30 days with moderate risk'",
    "Try: 'Show me my portfolio status'",
    "Try: 'Withdraw 500 USDC from my positions'",
    "Try: 'Rebalance my portfolio for better yields'"
  ];
  return examples[Math.floor(Math.random() * examples.length)];
};

/**
 * Validate command before execution
 */
export const validateCommand = (command) => {
  const errors = [];

  if (command.action === 'invest') {
    if (!command.amount || command.amount <= 0) {
      errors.push('Investment amount must be greater than 0');
    }
    if (command.amount && command.amount < 10) {
      errors.push('Minimum investment is 10 USDC');
    }
    if (command.duration < 1) {
      errors.push('Duration must be at least 1 day');
    }
    if (command.riskTolerance < 1 || command.riskTolerance > 100) {
      errors.push('Risk tolerance must be between 1 and 100');
    }
  }

  if (command.action === 'withdraw') {
    if (command.amount && command.amount <= 0) {
      errors.push('Withdrawal amount must be greater than 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
