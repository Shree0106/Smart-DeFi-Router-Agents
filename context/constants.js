import { ethers } from "ethers";
import Web3Modal from "web3modal";

// Internal Imports
import tokenICO from "./TokenICO.json";
import erc20 from "./ERC20.json";
import smartRouter from "./SmartDeFiRouter.json";

// ARCToken Address on Arc Testnet
export const TOKEN_ADDRESS = "0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2";
export const ERC20_ABI = erc20.abi;
export const OWNER_ADDRESS = "0xfEc13F54150E2eDf64A07A8BBE8672E10a35e9Cd";

// SmartDeFiRouter Address on Arc Testnet
export const ROUTER_ADDRESS = "0x2762ce47D9A3C74FD8B959802e367faD05c2B2a0";
export const ROUTER_ABI = smartRouter.abi;

// Default network configuration - Arc Testnet Only
export const DEFAULT_NETWORK = "arc_testnet";

// Contract addresses for Arc Testnet
export const CONTRACT_ADDRESSES = {
  arc_testnet: {
    TOKEN_ICO: "0xAa17E6983022E9552e189D19a7aB23F4b6D3E347", 
    TOKEN: "0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2",
  },
};

// Get contract address for current network
export const getContractAddress = (networkName, contractType = "TOKEN_ICO") => {
  return CONTRACT_ADDRESSES[networkName]?.[contractType] || CONTRACT_ADDRESSES[DEFAULT_NETWORK]?.[contractType];
};

export const CONTRACT_ADDRESS = getContractAddress(DEFAULT_NETWORK, "TOKEN_ICO");
export const CONTRACT_ABI = tokenICO.abi;

// Network configuration - Arc Testnet Only
const networks = {
  arc_testnet: {
    chainId: "0x4cef52", // 5042002 in decimal
    chainName: "Arc Testnet",
    nativeCurrency: {
      name: "ARC",
      symbol: "USDC",
      decimals: 18,
    },
    rpcUrls: [
      "https://rpc.testnet.arc.network",
    ],
    blockExplorerUrls: ["https://testnet.arcscan.app"],
  },
  localhost: {
    chainId: `0x${Number(31337).toString(16)}`,
    chainName: "Localhost",
    nativeCurrency: {
      name: "GO",
      symbol: "GO",
      decimals: 18,
    },
    rpcUrls: ["http://127.0.0.1:8545/"],
    blockExplorerUrls: ["http://localhost:8545"],
  },
};

// Changing the networks
const changeNetwork = async ({ networkName }) => {
  try {
    if (!window.ethereum) throw new Error("No crypto wallet found");
    
    // Get MetaMask provider specifically (ignore other wallet extensions like WELLDONE)
    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : null;

    if (!provider) {
      throw new Error("MetaMask not detected");
    }
    
    // First, try to switch to the network if it already exists
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networks[networkName].chainId }],
      });
      console.log(`✅ Switched to ${networkName} network`);
    } catch (switchError) {
      // Silently ignore errors from other wallet extensions
      if (switchError?.message && (switchError.message.includes("WELLDONE") || switchError.message.includes("not initialized"))) {
        console.log("⚠️ Ignoring WELLDONE wallet error");
        return;
      }
      
      // This error code means the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        console.log(`Adding ${networkName} network to MetaMask...`);
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              ...networks[networkName],
            },
          ],
        });
        console.log(`✅ Added and switched to ${networkName} network`);
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    // Silently ignore errors from other wallet extensions
    if (error?.message && (error.message.includes("WELLDONE") || error.message.includes("not initialized"))) {
      console.log("⚠️ Ignoring WELLDONE wallet error");
      return;
    }
    console.error("Network switch error:", error.message);
    throw error;
  }
};

export const handleNetworkSwitch = async (networkName = "arc_testnet") => {
  try {
    await changeNetwork({ networkName });
  } catch (error) {
    // Silently ignore errors from other wallet extensions
    if (error?.message && (error.message.includes("WELLDONE") || error.message.includes("not initialized"))) {
      console.log("⚠️ Ignoring wallet extension error during network switch");
      return;
    }
    // Re-throw other errors
    throw error;
  }
};

// Helper function to create a fallback read-only contract
export const createFallbackContract = (contractAddress, abi, networkName = DEFAULT_NETWORK) => {
  try {
    const rpcUrl = networks[networkName].rpcUrls[1] || networks[networkName].rpcUrls[0];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return fetchContract(contractAddress, abi, provider);
  } catch (error) {
    console.log("⚠️ Failed to create fallback contract:", error?.message || "Unknown error");
    return null;
  }
};

// Helper function to get MetaMask provider (simplified - always use MetaMask for transactions)
const getReliableProvider = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask extension.");
  }

  try {
    const { ethers } = await import("ethers");
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    
    console.log("✅ Using MetaMask provider");
    return browserProvider;
  } catch (error) {
    console.error("❌ Failed to get MetaMask provider:", error);
    throw new Error("Failed to connect to MetaMask. Please refresh and try again.");
  }
};

// Helper function to get current network
export const getCurrentNetwork = async () => {
  try {
    if (!window.ethereum) return null;
    
    // Get MetaMask provider specifically
    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : window.ethereum;

    const ethersProvider = new ethers.BrowserProvider(provider);
    const network = await ethersProvider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
    };
  } catch (error) {
    // Silently ignore WELLDONE wallet errors
    if (error?.message && (error.message.includes("WELLDONE") || error.message.includes("not initialized"))) {
      return null;
    }
    console.log("Error getting network:", error);
    return null;
  }
};

export const CHECK_WALLET_CONNECTED = async () => {
  try {
    if (!window.ethereum) {
      console.log("⚠️ Please install MetaMask");
      return null;
    }

    // Get MetaMask provider specifically (ignore other wallet extensions like WELLDONE)
    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : null;

    if (!provider) {
      console.log("⚠️ MetaMask not detected");
      return null;
    }

    // Switch to the correct network
    await handleNetworkSwitch(DEFAULT_NETWORK);

    const accounts = await provider.request({ method: "eth_accounts" });

    if (accounts.length) {
      console.log(`✅ Wallet connected: ${accounts[0]}`);
      console.log(`🌐 Network: ${DEFAULT_NETWORK}`);
      return accounts[0];
    } else {
      console.log("⚠️ No accounts found. Please connect your wallet.");
      return null;
    }
  } catch (error) {
    // Silently ignore errors from other wallet extensions
    if (error?.message && (error.message.includes("WELLDONE") || error.message.includes("not initialized"))) {
      return null;
    }
    console.error("❌ CHECK_WALLET_CONNECTED Error:", error.message);
    return null;
  }
};

export const CONNECT_WALLET = async () => {
  try {
    if (!window.ethereum) {
      alert("⚠️ Please install MetaMask to use this application!");
      return null;
    }

    // Get MetaMask provider specifically (ignore other wallet extensions like WELLDONE)
    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : null;

    if (!provider) {
      alert("⚠️ MetaMask not detected. Please install MetaMask extension!");
      return null;
    }

    // Request account access first
    const accounts = await provider.request({
      method: "eth_requestAccounts",
    });

    const connectedAccount = accounts[0];
    console.log(`✅ Wallet Connected!`);
    console.log(`📍 Address: ${connectedAccount}`);

    // Check current network
    const ethersProvider = new ethers.BrowserProvider(provider);
    const network = await ethersProvider.getNetwork();
    const currentChainId = Number(network.chainId);
    const expectedChainId = 5042002; // Arc Testnet

    console.log(`🌐 Current Chain ID: ${currentChainId}`);
    console.log(`🎯 Expected Chain ID: ${expectedChainId}`);

    // If not on correct network, automatically try to switch/add it
    if (currentChainId !== expectedChainId) {
      console.log("⚠️ Wrong network detected! Attempting to switch to Arc Testnet...");
      
      try {
        // Try switching first
        await SWITCH_TO_ARC_NETWORK();
        
        // If successful, return success
        console.log(`✅ Switched to Arc Testnet successfully!`);
        return {
          address: connectedAccount,
          wrongNetwork: false,
          currentChainId: expectedChainId,
          expectedChainId
        };
      } catch (switchError) {
        console.error("❌ Failed to switch network:", switchError.message);
        
        // Return connection info with network status for UI to handle
        return {
          address: connectedAccount,
          wrongNetwork: true,
          currentChainId,
          expectedChainId,
          networkName: "Arc Testnet",
          error: switchError.message
        };
      }
    }

    console.log(`✅ Connected to correct network: ${DEFAULT_NETWORK}`);
    return {
      address: connectedAccount,
      wrongNetwork: false,
      currentChainId,
      expectedChainId
    };

  } catch (error) {
    // Silently ignore errors from other wallet extensions
    if (error?.message && (error.message.includes("WELLDONE") || error.message.includes("not initialized"))) {
      return null;
    }
    console.error("❌ CONNECT_WALLET Error:", error.message);
    if (error.code === 4001) {
      alert("⚠️ Wallet connection rejected. Please approve the connection request.");
    } else {
      alert(`❌ Error connecting wallet: ${error.message}`);
    }
    return null;
  }
};

/**
 * Check if Arc Testnet already exists in MetaMask
 */
export const CHECK_NETWORK_EXISTS = async () => {
  try {
    if (!window.ethereum) return false;
    
    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : null;

    if (!provider) return false;

    // Try to switch to the network - if it works, it exists
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networks.arc_testnet.chainId }],
      });
      return true; // Network exists
    } catch (error) {
      if (error.code === 4902) {
        return false; // Network doesn't exist
      }
      // For other errors, assume it exists
      return true;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Add Arc Testnet network to MetaMask
 * Note: This function is typically called from SWITCH_TO_ARC_NETWORK
 */
export const ADD_NETWORK = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }

    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : null;

    if (!provider) {
      throw new Error("MetaMask not detected");
    }

    const targetChainId = "0x4cef52"; // Chain ID for Arc Testnet (5042002)

    console.log("📡 Adding Arc Testnet to MetaMask...");
    
    // Use exact format MetaMask expects
    const networkParams = {
      chainId: targetChainId,
      chainName: networks.arc_testnet.chainName,
      nativeCurrency: {
        name: networks.arc_testnet.nativeCurrency.name,
        symbol: networks.arc_testnet.nativeCurrency.symbol,
        decimals: Number(networks.arc_testnet.nativeCurrency.decimals),
      },
      rpcUrls: networks.arc_testnet.rpcUrls,
      blockExplorerUrls: networks.arc_testnet.blockExplorerUrls,
    };
    
    console.log("📋 Network Parameters:");
    console.log("   Network name:", networkParams.chainName);
    console.log("   RPC URL:", networkParams.rpcUrls[0]);
    console.log("   Chain ID:", parseInt(targetChainId, 16), `(hex: ${targetChainId})`);
    console.log("   Currency:", networkParams.nativeCurrency.symbol);
    console.log("   Decimals:", networkParams.nativeCurrency.decimals);
    console.log("   Explorer:", networkParams.blockExplorerUrls[0]);
    
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [networkParams],
    });

    console.log("✅ Arc Testnet network added successfully!");
    
    return { success: true, message: "Network added successfully" };

  } catch (error) {
    console.error("❌ ADD_NETWORK Error:", error);
    console.error("   Error code:", error.code);
    console.error("   Error message:", error.message);
    
    if (error.code === 4001) {
      throw new Error("You cancelled the network addition. Please try again when ready.");
    } else if (error.code === -32602) {
      throw new Error(
        "Invalid network parameters or network already exists.\n\n" +
        "SOLUTION:\n" +
        "1. Check if 'Arc Testnet' already exists in MetaMask\n" +
        "2. If yes, delete it: MetaMask → Networks → Arc Testnet → Delete\n" +
        "3. Try again\n\n" +
        "OR add manually:\n" +
        "• Network name: Arc Testnet\n" +
        "• RPC URL: https://rpc.testnet.arc.network\n" +
        "• Chain ID: 5042002\n" +
        "• Currency: USDC\n" +
        "• Decimals: 6\n" +
        "• Explorer: https://testnet.arcscan.app"
      );
    } else if (error.code === -32603) {
      throw new Error("MetaMask internal error. Try: Settings → Advanced → Reset Account");
    } else {
      throw new Error(`Failed to add network: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Switch to Arc Testnet network
 */
export const SWITCH_TO_ARC_NETWORK = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not found. Please install MetaMask extension.");
    }

    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : null;

    if (!provider) {
      throw new Error("MetaMask not detected. Make sure MetaMask is installed and unlocked.");
    }

    console.log("🔄 Switching to Arc Testnet...");
    console.log("📍 Target Chain ID:", networks.arc_testnet.chainId, "(decimal: 5042002)");

    try {
      // Try to switch to the network first - this is the safest approach
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: networks.arc_testnet.chainId }],
      });

      console.log("✅ Switched to Arc Testnet (network already existed)!");
      return { success: true };

    } catch (switchError) {
      console.log("⚠️ Switch error code:", switchError.code);
      console.log("⚠️ Switch error message:", switchError.message);
      
      // If network doesn't exist (error code 4902), add it immediately
      if (switchError.code === 4902) {
        console.log("📡 Network not found in MetaMask. Adding it now...");
        
        try {
          // Add network with the exact parameters
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: networks.arc_testnet.chainId,
              chainName: networks.arc_testnet.chainName,
              nativeCurrency: {
                name: networks.arc_testnet.nativeCurrency.name,
                symbol: networks.arc_testnet.nativeCurrency.symbol,
                decimals: Number(networks.arc_testnet.nativeCurrency.decimals),
              },
              rpcUrls: networks.arc_testnet.rpcUrls,
              blockExplorerUrls: networks.arc_testnet.blockExplorerUrls,
            }],
          });
          
          console.log("✅ Arc Testnet added and switched successfully!");
          return { success: true, message: "Network added successfully" };
          
        } catch (addError) {
          console.error("❌ Failed to add network:", addError);
          console.error("   Add error code:", addError.code);
          console.error("   Add error message:", addError.message);
          
          // Handle specific error codes
          if (addError.code === 4001) {
            throw new Error("You cancelled the network addition. Please try again when ready.");
          } else if (addError.code === -32602) {
            throw new Error(
              "⚠️ Network Already Exists in MetaMask\n\n" +
              "A network with Chain ID 5042002 already exists in your MetaMask.\n\n" +
              "📋 SOLUTION - Delete the existing network:\n\n" +
              "1. Open MetaMask\n" +
              "2. Click the network dropdown (top)\n" +
              "3. Find 'Arc Testnet' or any network with Chain ID 5042002\n" +
              "4. Click the 3 dots (...) next to it → Delete\n" +
              "5. Refresh this page and try again\n\n" +
              "OR add it manually with these exact values:\n" +
              "• Network name: Arc Testnet\n" +
              "• RPC URL: https://rpc.testnet.arc.network\n" +
              "• Chain ID: 5042002\n" +
              "• Currency: USDC\n" +
              "• Decimals: 6\n" +
              "• Explorer: https://testnet.arcscan.app"
            );
          } else {
            throw new Error(
              `Failed to add Arc Testnet: ${addError.message || 'Unknown error'}\n\n` +
              "Try adding the network manually in MetaMask:\n" +
              "1. MetaMask → Networks → Add Network\n" +
              "2. Add network manually\n" +
              "3. Use these values:\n" +
              "   - Network name: Arc Testnet\n" +
              "   - RPC URL: https://rpc.testnet.arc.network\n" +
              "   - Chain ID: 5042002\n" +
              "   - Currency: USDC\n" +
              "   - Decimals: 6\n" +
              "   - Explorer: https://testnet.arcscan.app"
            );
          }
        }
      }
      
      // User cancelled the switch
      if (switchError.code === 4001) {
        throw new Error("You cancelled the network switch. Please try again when ready.");
      }
      
      // For other switch errors, provide helpful context
      throw new Error(
        `Failed to switch to Arc Testnet: ${switchError.message}\n\n` +
        `Error code: ${switchError.code}\n\n` +
        "Possible solutions:\n" +
        "1. Delete 'Arc Testnet' from MetaMask if it already exists\n" +
        "2. Update MetaMask to the latest version\n" +
        "3. Try a different browser\n" +
        "4. Add the network manually in MetaMask"
      );
    }

  } catch (error) {
    console.error("❌ SWITCH_TO_ARC_NETWORK Error:", error);
    
    // Don't wrap errors that are already user-friendly
    if (error.message && (
      error.message.includes("cancelled") ||
      error.message.includes("SOLUTION") ||
      error.message.includes("Try adding")
    )) {
      throw error;
    }
    
    // Wrap other errors with helpful context
    throw new Error(
      `Unable to switch to Arc Testnet: ${error.message || 'Unknown error'}\n\n` +
      "Possible solutions:\n" +
      "1. Delete 'Arc Testnet' from MetaMask if it exists\n" +
      "2. Update MetaMask to the latest version\n" +
      "3. Add the network manually in MetaMask"
    );
  }
};

const fetchContract = (address, abi, signerOrProvider) =>
  new ethers.Contract(address, abi, signerOrProvider);

export const TOKEN_ICO_CONTRACT = async () => {
  try {
    // Check if window and ethereum are available
    if (typeof window === "undefined") {
      console.log("⚠️ Window is not defined (server-side)");
      return null;
    }

    if (!window.ethereum) {
      console.log("⚠️ Please install MetaMask");
      return null;
    }

    // Check if ethers is properly loaded
    if (!ethers || !ethers.BrowserProvider) {
      console.log("⚠️ Ethers library not properly loaded");
      return null;
    }

    // Get MetaMask provider specifically (ignore other wallet extensions)
    const provider = window.ethereum.providers 
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : window.ethereum.isMetaMask 
      ? window.ethereum 
      : null;

    if (!provider) {
      console.log("⚠️ MetaMask not detected");
      return null;
    }

    // Request accounts first to ensure connection
    try {
      const accounts = await provider.request({ 
        method: 'eth_accounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        console.log("⚠️ No wallet connected. Please connect your wallet first.");
        return null;
      }
    } catch (accountError) {
      // Silently ignore WELLDONE wallet errors
      if (accountError?.message && accountError.message.includes("WELLDONE")) {
        return null;
      }
      console.log("⚠️ Failed to get accounts:", accountError?.message || "Unknown error");
      return null;
    }

    // Use ethers v6 syntax - BrowserProvider instead of Web3Provider
    const ethersProvider = new ethers.BrowserProvider(provider);
    
    // Get network with better error handling
    let network;
    try {
      network = await ethersProvider.getNetwork();
    } catch (networkError) {
      console.log("⚠️ Failed to get network:", networkError?.message || "Unknown error");
      console.log("💡 Please ensure MetaMask is connected and unlocked");
      return null;
    }

    const networkName = Object.keys(networks).find(
      (key) => networks[key].chainId === `0x${Number(network.chainId).toString(16)}`
    );

    console.log(`🌐 Connected to network: ${networkName || 'unknown'} (Chain ID: ${network.chainId})`);

    // Get the correct contract address for this network
    const contractAddress = getContractAddress(networkName || DEFAULT_NETWORK, "TOKEN_ICO");

    if (!contractAddress) {
      console.log(`⚠️ No contract address found for network: ${networkName}`);
      console.log(`💡 Please ensure you're on Arc Testnet (Chain ID: 5042002)`);
      return null;
    }

    // Verify contract exists on this network with better error handling
    // Use fallback RPC provider if MetaMask provider fails
    let contractExists = false;
    try {
      const code = await ethersProvider.getCode(contractAddress);
      if (code === "0x" || code === "0x0") {
        console.log(`⚠️ Contract not deployed at ${contractAddress} on ${networkName} (Chain ID: ${network.chainId})`);
        console.log(`💡 Expected network: ${DEFAULT_NETWORK}`);
        console.log(`💡 Please deploy your contract to ${networkName} or update the CONTRACT_ADDRESS in context/constants.js`);
        return null;
      }
      contractExists = true;
      console.log(`✅ Contract verified at ${contractAddress}`);
    } catch (codeError) {
      // Silently ignore WELLDONE wallet errors
      if (codeError?.message && codeError.message.includes("WELLDONE")) {
        return null;
      }
      console.log("⚠️ MetaMask RPC failed to check contract code:", codeError?.message || "Unknown error");
      
      // Try with fallback RPC provider directly (without MetaMask)
      console.log("� Trying fallback RPC provider...");
      try {
        const fallbackRpcUrl = networks[networkName || DEFAULT_NETWORK].rpcUrls[1] || networks[networkName || DEFAULT_NETWORK].rpcUrls[0];
        const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrl);
        const codeFromFallback = await fallbackProvider.getCode(contractAddress);
        
        if (codeFromFallback === "0x" || codeFromFallback === "0x0") {
          console.log(`⚠️ Contract not deployed at ${contractAddress}`);
          return null;
        }
        
        contractExists = true;
        console.log(`✅ Contract verified via fallback RPC at ${contractAddress}`);
        console.log(`💡 MetaMask RPC has issues. Consider changing RPC URL in MetaMask settings.`);
      } catch (fallbackError) {
        console.log("⚠️ Fallback RPC also failed:", fallbackError?.message || "Unknown error");
        console.log("⚠️ Proceeding anyway - contract calls will fail if contract doesn't exist");
      }
    }

    const signer = await ethersProvider.getSigner();
    const contract = fetchContract(contractAddress, CONTRACT_ABI, signer);
    
    console.log(`✅ Contract loaded at ${contractAddress} on ${networkName}`);
    return contract;
  } catch (error) {
    const errorMsg = error?.message || error?.reason || "Unknown error";
    console.log("❌ TOKEN_ICO_CONTRACT Error:", errorMsg);
    
    if (errorMsg.includes("user rejected")) {
      console.log("💡 User rejected the connection request");
    } else if (errorMsg.includes("eth_getCode")) {
      console.log("💡 RPC connection issue. Please check your network connection.");
    } else if (errorMsg.includes("Cannot read properties of undefined")) {
      console.log("💡 MetaMask connection issue. Please refresh and try again.");
    }
    
    return null;
  }
};

export const ERC20_CONTRACT = async (address) => {
  try {
    // Check if window and ethereum are available
    if (typeof window === "undefined") {
      console.log("⚠️ Window is not defined (server-side)");
      return null;
    }

    if (!window.ethereum) {
      console.log("⚠️ Please install MetaMask");
      return null;
    }

    // Check if ethers is properly loaded
    if (!ethers || !ethers.BrowserProvider) {
      console.log("⚠️ Ethers library not properly loaded");
      return null;
    }

    // Use ethers v6 syntax - BrowserProvider instead of Web3Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    const networkName = Object.keys(networks).find(
      (key) => networks[key].chainId === `0x${Number(network.chainId).toString(16)}`
    );

    console.log(`🌐 ERC20 connected to: ${networkName || 'unknown'} (Chain ID: ${network.chainId})`);

    const signer = await provider.getSigner();
    const tokenAddress = address || getContractAddress(networkName || DEFAULT_NETWORK, "TOKEN");
    
    console.log(`📍 Token address: ${tokenAddress}`);
    
    const contract = fetchContract(tokenAddress, ERC20_ABI, signer);
    return contract;
  } catch (error) {
    console.log("❌ ERC20_CONTRACT Error:", error.message);
    return null;
  }
};

export const ERC20 = async () => {
  try {
    // Check if window and ethereum are available
    if (typeof window === "undefined") {
      console.log("Window is not defined");
      return null;
    }

    if (!window.ethereum) {
      console.log("Please install MetaMask");
      return null;
    }

    // Check if ethers is properly loaded
    if (!ethers || !ethers.BrowserProvider) {
      console.log("Ethers library not properly loaded");
      return null;
    }

    // Use ethers v6 syntax - BrowserProvider instead of Web3Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = fetchContract(TOKEN_ADDRESS, ERC20_ABI, signer);
    const network = await provider.getNetwork();
    const userAddress = await signer.getAddress();
    const balance = await contract.balanceOf(userAddress);
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const decimals = await contract.decimals();
    const address = await contract.getAddress();

    const token = {
      address: address,
      name: name,
      symbol: symbol,
      decimals: decimals,
      supply: ethers.formatEther(totalSupply.toString()),
      balance: ethers.formatEther(balance.toString()),
      chainId: network.chainId,
    };

    console.log(token);
    return token;
  } catch (error) {
    console.log("ERC20 Error:", error.message);
    return null;
  }
};

export const GET_BALANCE = async () => {
  try {
    // Check if window and ethereum are available
    if (typeof window === "undefined") {
      console.log("Window is not defined");
      return "0";
    }

    if (!window.ethereum) {
      console.log("Please install MetaMask");
      return "0";
    }

    // Check if ethers is properly loaded
    if (!ethers || !ethers.BrowserProvider) {
      console.log("Ethers library not properly loaded");
      return "0";
    }

    // Use ethers v6 syntax - BrowserProvider instead of Web3Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    try {
      const nativeBalance = await provider.getBalance(signer.address);
      return ethers.formatEther(nativeBalance.toString());
    } catch (balanceError) {
      console.log("⚠️ MetaMask RPC failed to get balance, trying fallback...");
      
      // Try with fallback RPC
      try {
        const fallbackRpcUrl = networks[DEFAULT_NETWORK].rpcUrls[1] || networks[DEFAULT_NETWORK].rpcUrls[0];
        const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrl);
        const balance = await fallbackProvider.getBalance(signer.address);
        console.log("✅ Balance retrieved via fallback RPC");
        return ethers.formatEther(balance.toString());
      } catch (fallbackError) {
        console.log("⚠️ Fallback RPC also failed for balance:", fallbackError.message);
        return "0";
      }
    }
  } catch (error) {
    console.log("GET_BALANCE Error:", error.message);
    return "0";
  }
};

export const CHECK_ACCOUNT_BALANCE = async (ADDRESS) => {
  try {
    // Check if window and ethereum are available
    if (typeof window === "undefined") {
      console.log("Window is not defined");
      return "0";
    }

    if (!window.ethereum) {
      console.log("Please install MetaMask");
      return "0";
    }

    // Check if ethers is properly loaded
    if (!ethers || !ethers.BrowserProvider) {
      console.log("Ethers library not properly loaded");
      return "0";
    }

    // Use ethers v6 syntax - BrowserProvider instead of Web3Provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    try {
      const maticBal = await provider.getBalance(ADDRESS);
      return ethers.formatEther(maticBal.toString());
    } catch (balanceError) {
      console.log("⚠️ MetaMask RPC failed to get account balance, trying fallback...");
      
      // Try with fallback RPC
      try {
        const fallbackRpcUrl = networks[DEFAULT_NETWORK].rpcUrls[1] || networks[DEFAULT_NETWORK].rpcUrls[0];
        const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrl);
        const balance = await fallbackProvider.getBalance(ADDRESS);
        console.log("✅ Account balance retrieved via fallback RPC");
        return ethers.formatEther(balance.toString());
      } catch (fallbackError) {
        console.log("⚠️ Fallback RPC also failed for account balance:", fallbackError.message);
        return "0";
      }
    }
  } catch (error) {
    console.log("CHECK_ACCOUNT_BALANCE Error:", error.message);
    return "0";
  }
};

const tokenImage =
  "https://www.daulathussain.com/wp-content/uploads/2024/05/theblockchaincoders.jpg";

export const addTokenToMetamask = async () => {
  if (window.ethereum) {
    try {
      const tokenDetails = await ERC20();
      const tokenDecimals = tokenDetails?.decimals || 18;
      const tokenAddress = TOKEN_ADDRESS;
      const tokenSymbol = tokenDetails?.symbol || "TKN";

      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage,
          },
        },
      });

      if (wasAdded) {
        return "Token added";
      } else {
        return "Token not added";
      }
    } catch (error) {
      console.log(error);
      return "Failed to add token";
    }
  } else {
    return "Metamask not found";
  }
};

// ===========================================
// SMART DEFI ROUTER FUNCTIONS
// ===========================================

/**
 * Get SmartDeFiRouter contract instance
 */
export const ROUTER_CONTRACT = async () => {
  try {
    if (!window.ethereum) {
      console.log("⚠️ Please install MetaMask");
      return null;
    }

    const ethersProvider = await getReliableProvider();
    const signer = await ethersProvider.getSigner();
    const contract = fetchContract(ROUTER_ADDRESS, ROUTER_ABI, signer);
    
    console.log(`✅ Router contract loaded at ${ROUTER_ADDRESS}`);
    return contract;
  } catch (error) {
    console.log("❌ ROUTER_CONTRACT Error:", error.message);
    return null;
  }
};

/**
 * Calculate optimal route (no on-chain storage needed)
 * This function calculates the route client-side based on available protocols
 */
export const CALCULATE_OPTIMAL_ROUTE = async (amount, riskLevel, targetYield, duration) => {
  try {
    console.log("� Calculating optimal route...");
    console.log("- Amount:", amount, "USDC");
    console.log("- Risk Level:", riskLevel + "/100");
    console.log("- Target Yield:", targetYield + "%");
    console.log("- Duration:", duration, "days");

    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
    if (riskLevel < 0 || riskLevel > 100) {
      throw new Error("Risk level must be between 0 and 100");
    }
    if (targetYield <= 0 || targetYield > 100) {
      throw new Error("Target yield must be between 0 and 100%");
    }
    if (duration <= 0) {
      throw new Error("Duration must be positive");
    }

    // Get all available protocols
    const protocols = await GET_ALL_PROTOCOLS();
    
    if (!protocols || protocols.length === 0) {
      throw new Error("No protocols available. Please add protocols to the router.");
    }

    console.log("✅ Found", protocols.length, "protocols");

    // Filter protocols by risk tolerance
    const suitableProtocols = protocols.filter(p => 
      p.isActive && p.riskScore <= riskLevel
    );

    if (suitableProtocols.length === 0) {
      throw new Error("No protocols match your risk tolerance. Try increasing risk level.");
    }

    console.log("✅ Found", suitableProtocols.length, "suitable protocols");

    // Sort by yield (highest first)
    suitableProtocols.sort((a, b) => b.currentYield - a.currentYield);

    // Take top 3-5 protocols
    const selectedProtocols = suitableProtocols.slice(0, Math.min(5, suitableProtocols.length));

    // Distribute amount across selected protocols
    const amountPerProtocol = amount / selectedProtocols.length;
    
    const route = {
      protocols: selectedProtocols.map(p => p.address),
      protocolNames: selectedProtocols.map(p => p.name),
      amounts: selectedProtocols.map(() => amountPerProtocol.toFixed(6)),
      yields: selectedProtocols.map(p => p.currentYield),
      risks: selectedProtocols.map(p => p.riskScore),
    };

    // Calculate weighted average yield
    const totalYield = selectedProtocols.reduce((sum, p) => sum + p.currentYield, 0);
    const avgYield = totalYield / selectedProtocols.length;

    // Calculate weighted average risk
    const totalRisk = selectedProtocols.reduce((sum, p) => sum + p.riskScore, 0);
    const avgRisk = totalRisk / selectedProtocols.length;

    route.expectedYield = avgYield;
    route.riskScore = avgRisk;

    console.log("✅ Route calculated!");
    console.log("📊 Selected Protocols:", route.protocolNames);
    console.log("💰 Distribution:", route.amounts.join(", "));
    console.log("📈 Expected Yield:", avgYield.toFixed(2) + "%");
    console.log("⚠️ Average Risk:", avgRisk.toFixed(0) + "/100");

    return route;

  } catch (error) {
    console.error("❌ CALCULATE_OPTIMAL_ROUTE Error:", error);
    throw error;
  }
};

/**
 * Calculate optimal route
 */
export const CALCULATE_ROUTE = async (amount) => {
  try {
    console.log("🔄 Calculating optimal route...");
    
    // Check wallet connection - auto-connect if not connected
    let address = await CHECK_WALLET_CONNECTED();
    if (!address) {
      console.log("⚠️ Wallet not connected. Attempting to connect...");
      const connectResult = await CONNECT_WALLET();
      
      if (!connectResult || !connectResult.address) {
        throw new Error("Wallet connection failed. Please connect your wallet and try again.");
      }
      
      address = connectResult.address;
      console.log("✅ Wallet connected successfully:", address);
    }

    // Convert amount to wei (USDC has 18 decimals in your ERC20)
    const amountWei = ethers.parseEther(amount.toString());

    // Try with MetaMask first, then fallback to direct RPC
    let protocols, amounts, expectedYield, riskScore;
    
    try {
      const contract = await ROUTER_CONTRACT();
      if (!contract) throw new Error("Failed to get router contract");

      [protocols, amounts, expectedYield, riskScore] = 
        await contract.calculateOptimalRoute(address, amountWei);
        
      console.log("✅ Route calculated via MetaMask!");
    } catch (metaMaskError) {
      console.log("⚠️ MetaMask RPC failed, trying fallback RPC...");
      
      // Use fallback RPC provider
      const fallbackRpcUrl = networks[DEFAULT_NETWORK].rpcUrls[1] || networks[DEFAULT_NETWORK].rpcUrls[0];
      const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrl);
      const fallbackContract = fetchContract(ROUTER_ADDRESS, ROUTER_ABI, fallbackProvider);
      
      [protocols, amounts, expectedYield, riskScore] = 
        await fallbackContract.calculateOptimalRoute(address, amountWei);
        
      console.log("✅ Route calculated via fallback RPC!");
    }

    console.log("📍 Protocols:", protocols);
    console.log("💰 Amounts:", amounts.map(a => ethers.formatEther(a)));
    console.log("📈 Expected Yield:", expectedYield.toString(), "basis points");
    console.log("⚠️ Risk Score:", riskScore.toString());

    return {
      protocols,
      amounts: amounts.map(a => ethers.formatEther(a)),
      expectedYield: Number(expectedYield) / 100, // Convert basis points to percentage
      riskScore: Number(riskScore),
    };
  } catch (error) {
    console.error("❌ CALCULATE_ROUTE Error:", error);
    throw error;
  }
};

/**
 * Execute optimized route
 */
export const EXECUTE_ROUTE = async (route, amount) => {
  try {
    console.log("🚀 Executing route...");
    console.log("Route details:", route);
    console.log("Amount:", amount, "USDC");

    // Validate inputs
    if (!route || (!route.protocols || route.protocols.length === 0) && (!route.protocol_names || route.protocol_names.length === 0)) {
      throw new Error("Invalid route. Please calculate a route first.");
    }

    if (!amount || amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // Check wallet connection - auto-connect if not connected
    let address = await CHECK_WALLET_CONNECTED();
    if (!address) {
      console.log("⚠️ Wallet not connected. Attempting to connect...");
      const connectResult = await CONNECT_WALLET();
      
      if (!connectResult || !connectResult.address) {
        throw new Error("Wallet connection failed. Please connect your wallet and try again.");
      }
      
      address = connectResult.address;
      console.log("✅ Wallet connected successfully:", address);
    }

    // IMPORTANT: Check if these are mock protocols (not registered in contract)
    const isMockRoute = route.protocols && route.protocols.length > 0 && 
      route.protocols[0].match(/^0x[1-8]{40}$/);
    
    if (isMockRoute) {
      console.log("⚠️ DEMO MODE DETECTED");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💡 This route uses mock protocols that aren't deployed.");
      console.log("💡 Showing simulation instead of real execution.");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      
      // Simulate the execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        hash: "0x" + "0".repeat(64), // Mock transaction hash
        blockNumber: 13179500,
        gasUsed: "250000",
        status: 1,
        demo: true,
        message: 
          "🎭 DEMO MODE - Simulation Successful!\n\n" +
          `Your ${amount} USDC would be distributed across ${route.protocol_names?.length || route.protocols?.length} protocols:\n\n` +
          (route.protocol_names?.map((name, i) => 
            `  • ${name}: ${route.amounts?.[i] || (amount / route.protocol_names.length).toFixed(2)} USDC (${route.yields?.[i] || 0}% APY)`
          ).join('\n') || '') +
          "\n\n📊 Expected Results:\n" +
          `  • Total Yield: ${route.expected_yield || route.expectedYield || 0}% APY\n` +
          `  • Risk Score: ${route.risk_score || route.riskScore || 0}/100\n\n` +
          "⚠️ To execute real transactions:\n" +
          "1. Deploy actual DeFi protocol contracts\n" +
          "2. Register them in SmartDeFiRouter using addProtocol()\n" +
          "3. Try executing again"
      };
    }

    // Get contracts with better error handling
    let contract, tokenContract;
    
    try {
      contract = await ROUTER_CONTRACT();
      if (!contract) throw new Error("Failed to get router contract");
      
      tokenContract = await ERC20_CONTRACT(TOKEN_ADDRESS);
      if (!tokenContract) throw new Error("Failed to get token contract");
    } catch (contractError) {
      console.error("Contract loading error:", contractError);
      throw new Error("Failed to load contracts. Please refresh and try again.");
    }

    // Convert amount to wei (18 decimals for ERC20)
    const amountWei = ethers.parseEther(amount.toString());

    console.log("📊 Route parameters:");
    console.log("- Expected Yield:", route.expected_yield || route.expectedYield, "%");
    console.log("- Risk Score:", route.risk_score || route.riskScore);
    console.log("- Number of Protocols:", route.protocols?.length || route.protocol_names?.length);

    // Step 1: Check if contract has protocols registered
    console.log("📝 Step 1: Checking contract protocols...");
    try {
      const protocolCount = await contract.protocolCount();
      console.log("✅ Contract has", protocolCount.toString(), "protocols registered");
      
      if (protocolCount === 0n || protocolCount === 0) {
        throw new Error(
          "❌ No protocols registered in the SmartDeFiRouter contract!\n\n" +
          "The contract owner needs to add protocols first using addProtocol().\n\n" +
          "This is a deployment/setup issue. Please contact the contract owner or:\n" +
          "1. Check if the contract is properly initialized\n" +
          "2. Verify protocols have been added via the owner account\n" +
          "3. Redeploy the contract with initial protocols if needed"
        );
      }
    } catch (protocolCheckError) {
      if (protocolCheckError.message && protocolCheckError.message.includes("No protocols registered")) {
        throw protocolCheckError; // Re-throw our custom error
      }
      console.log("⚠️ Could not check protocol count:", protocolCheckError.message);
      console.log("💡 Continuing anyway, but execution may fail...");
    }

    // Step 2: Set user strategy (required by contract)
    console.log("📝 Step 2: Setting user strategy...");
    try {
      const targetYield = Math.floor((route.expected_yield || route.expectedYield || 5) * 100); // Convert to basis points
      const maxRisk = Math.floor(route.risk_score || route.riskScore || 50);
      const duration = 30 * 24 * 60 * 60; // 30 days in seconds
      const autoRebalance = true;
      const rebalanceThreshold = 5; // 5% yield drop

      console.log("Strategy params:");
      console.log("- Target Yield:", targetYield, "basis points");
      console.log("- Max Risk:", maxRisk);
      console.log("- Duration:", duration, "seconds");

      const strategyTx = await contract.setStrategy(
        targetYield,
        maxRisk,
        duration,
        autoRebalance,
        rebalanceThreshold,
        { gasLimit: 200000 }
      );

      console.log("⏳ Waiting for strategy transaction...");
      const strategyReceipt = await strategyTx.wait();
      
      if (strategyReceipt.status === 0) {
        throw new Error("Strategy transaction failed on-chain");
      }
      
      console.log("✅ Strategy set successfully!");
    } catch (strategyError) {
      console.error("Strategy setting error:", strategyError);
      
      // Check for common revert reasons
      if (strategyError.message && strategyError.message.includes("Max risk must be 1-100")) {
        throw new Error("Invalid risk level. Must be between 1 and 100.");
      }
      
      throw new Error("Failed to set strategy: " + (strategyError.reason || strategyError.message || "Unknown error"));
    }

    // Step 2: Check current allowance and approve if needed
    console.log("📝 Step 3: Checking token allowance...");
    console.log("Amount needed:", amountWei.toString(), "wei");
    
    let needsApproval = true;
    let currentAllowance = 0n;
    
    try {
      // Check current allowance using fallback RPC if MetaMask fails
      try {
        currentAllowance = await tokenContract.allowance(address, ROUTER_ADDRESS);
        console.log("✅ Current allowance:", currentAllowance.toString(), "wei");
      } catch (allowanceCheckError) {
        console.log("⚠️ MetaMask RPC failed checking allowance, using fallback...");
        // Try with fallback RPC
        const fallbackRpcUrl = networks[DEFAULT_NETWORK].rpcUrls[1] || networks[DEFAULT_NETWORK].rpcUrls[0];
        const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrl);
        const fallbackTokenContract = fetchContract(TOKEN_ADDRESS, ERC20_ABI, fallbackProvider);
        currentAllowance = await fallbackTokenContract.allowance(address, ROUTER_ADDRESS);
        console.log("✅ Current allowance (via fallback):", currentAllowance.toString(), "wei");
      }
      
      if (currentAllowance >= amountWei) {
        console.log("✅ Sufficient allowance already exists! Skipping approval.");
        console.log("💰 Current allowance covers the amount needed.");
        needsApproval = false;
      } else {
        const shortfall = amountWei - currentAllowance;
        console.log("⚠️ Need additional approval for:", shortfall.toString(), "wei");
      }
    } catch (allowanceError) {
      console.log("⚠️ Could not check allowance:", allowanceError.message);
      console.log("💡 Will attempt approval anyway...");
    }
    
    if (needsApproval) {
      console.log("\n📝 Step 3a: Token Approval Required");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("💡 You need to approve the router contract to spend your USDC");
      console.log("📊 Amount to approve:", ethers.formatEther(amountWei), "USDC");
      console.log("📍 Spender (Router):", ROUTER_ADDRESS);
      console.log("\n🔔 Please check MetaMask and approve the token spending...");
      
      try {
        let approveTx;
        
        // Estimate gas for approval
        let approvalGasEstimate;
        try {
          approvalGasEstimate = await tokenContract.approve.estimateGas(ROUTER_ADDRESS, amountWei);
          console.log("⛽ Estimated gas for approval:", approvalGasEstimate.toString());
        } catch (gasEstError) {
          console.log("⚠️ Could not estimate gas, using default");
          approvalGasEstimate = 100000n;
        }

        // Send approval transaction with better parameters
        try {
          console.log("\n🔔 Opening MetaMask for approval...");
          
          approveTx = await tokenContract.approve(ROUTER_ADDRESS, amountWei, {
            gasLimit: approvalGasEstimate
          });
          
          console.log("\n✅ Approval transaction sent!");
          console.log("📍 Transaction Hash:", approveTx.hash);
          console.log("🔗 Track on Explorer:");
          console.log("   https://testnet.arcscan.app/tx/" + approveTx.hash);
          
        } catch (txSendError) {
          // Check if user rejected
          if (txSendError.code === "ACTION_REJECTED" || 
              txSendError.code === 4001 ||
              (txSendError.message && txSendError.message.includes("user rejected"))) {
            throw new Error("You rejected the approval in MetaMask. Please approve to continue with the transaction.");
          }
          
          // For other errors, throw with helpful message
          console.error("❌ Approval send error:", txSendError);
          throw new Error("Failed to send approval transaction: " + (txSendError.message || "Unknown error"));
        }
        
        // Wait for confirmation with timeout and fallback
        console.log("⏳ Waiting for approval confirmation...");
        console.log("💡 This may take 10-30 seconds on Arc Testnet");
        
        try {
          // Try to wait for confirmation
          const receipt = await Promise.race([
            approveTx.wait(1),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("timeout")), 45000)
            )
          ]);
          
          console.log("\n✅ Approval confirmed on-chain!");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("📍 Block:", receipt.blockNumber);
          console.log("⛽ Gas Used:", receipt.gasUsed.toString());
          console.log("✅ Status:", receipt.status === 1 ? "Success" : "Failed");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
          
        } catch (waitError) {
          // Confirmation failed or timed out
          console.log("\n⚠️ Could not confirm approval transaction");
          console.log("💡 This is likely an RPC issue - checking if approval succeeded anyway...");
          
          // Wait a bit for transaction to settle
          console.log("⏳ Waiting 8 seconds for transaction to process...");
          await new Promise(resolve => setTimeout(resolve, 8000));
          
          // Check allowance again to see if approval went through
          console.log("� Rechecking allowance to verify approval...");
          try {
            // Use fallback RPC for reliable check
            const fallbackRpcUrl = networks[DEFAULT_NETWORK].rpcUrls[1] || networks[DEFAULT_NETWORK].rpcUrls[0];
            const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrl);
            const fallbackTokenContract = fetchContract(TOKEN_ADDRESS, ERC20_ABI, fallbackProvider);
            const newAllowance = await fallbackTokenContract.allowance(address, ROUTER_ADDRESS);
            
            console.log("📊 New allowance:", newAllowance.toString(), "wei");
            console.log("📊 Required:", amountWei.toString(), "wei");
            
            if (newAllowance >= amountWei) {
              console.log("✅ Approval verified! Transaction succeeded despite RPC issue.");
              console.log("💡 Proceeding with route execution...");
            } else {
              throw new Error(
                "Approval verification failed. Current allowance: " + newAllowance.toString() + 
                " wei, needed: " + amountWei.toString() + " wei. " +
                "The transaction may still be pending. Wait 30 seconds and try clicking 'Execute Route' again."
              );
            }
          } catch (recheckError) {
            console.error("Could not recheck allowance:", recheckError);
            throw new Error(
              "Could not verify if approval succeeded due to RPC issues. " +
              "Check the transaction on the explorer: https://testnet.arcscan.app/tx/" + approveTx.hash + " " +
              "If it succeeded, click 'Execute Route' again to proceed."
            );
          }
        }
        
      } catch (approvalError) {
        console.error("❌ Approval process error:", approvalError);
        throw approvalError; // Re-throw to be caught by outer catch
      }
    }

    // Step 3: Execute route
    console.log("⏳ Step 4: Executing route on-chain...");
    console.log("\n💡 The contract will automatically calculate optimal distribution.");
    console.log("💡 Please check MetaMask for transaction details and approve.");

    let tx;
    try {
      // Estimate gas for the transaction
      let gasEstimate;
      try {
        gasEstimate = await contract.executeRoute.estimateGas(amountWei);
        console.log("⛽ Estimated gas:", gasEstimate.toString());
      } catch (gasEstError) {
        console.log("⚠️ Could not estimate gas:", gasEstError.message);
        
        // Check for specific revert reasons
        if (gasEstError.message && gasEstError.message.includes("Strategy not set")) {
          throw new Error("Strategy was not properly set. Please try again or contact support.");
        }
        if (gasEstError.message && gasEstError.message.includes("No protocols match criteria")) {
          throw new Error(
            "No protocols match your strategy criteria!\n\n" +
            "This means the contract doesn't have protocols that fit your risk/yield requirements.\n" +
            "Try adjusting your risk tolerance or contact the contract owner to add more protocols."
          );
        }
        
        console.log("💡 Using default gas limit");
        gasEstimate = 500000n;
      }

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * 120n) / 100n;
      console.log("⛽ Gas limit with buffer:", gasLimit.toString());

      // Send transaction with detailed parameters
      console.log("\n🔔 Opening MetaMask...");
      console.log("📋 Transaction Details:");
      console.log("   - Function: executeRoute(amount)");
      console.log("   - Amount:", amount, "USDC");
      console.log("   - Expected Protocols:", route.protocol_names?.length || route.protocols?.length || "multiple");
      console.log("   - Gas Limit:", gasLimit.toString());
      
      tx = await contract.executeRoute(
        amountWei,
        {
          gasLimit: gasLimit,
        }
      );
      
      console.log("\n✅ Transaction sent!");
      console.log("📍 Transaction Hash:", tx.hash);
      console.log("🔗 View on Arc Explorer:");
      console.log("   https://testnet.arcscan.app/tx/" + tx.hash);
      console.log("\n⏳ Waiting for confirmation...");
    } catch (executeError) {
      console.error("❌ Execute transaction error:", executeError);
      
      // Enhanced error messages
      if (executeError.code === "ACTION_REJECTED" || executeError.code === 4001) {
        throw new Error("Transaction rejected in MetaMask. Please approve the transaction to continue.");
      } else if (executeError.code === "INSUFFICIENT_FUNDS" || executeError.code === -32000) {
        throw new Error("Insufficient ARC for gas fees. Please add more ARC to your wallet.");
      } else if (executeError.message && executeError.message.includes("insufficient allowance")) {
        throw new Error("Insufficient token allowance. Please try again or increase allowance.");
      } else if (executeError.message && executeError.message.includes("Strategy not set")) {
        throw new Error("Strategy not set in contract. The setStrategy transaction may have failed. Please try again.");
      } else if (executeError.message && executeError.message.includes("No protocols match criteria")) {
        throw new Error(
          "❌ No protocols match your criteria!\n\n" +
          "The contract doesn't have protocols that fit your strategy.\n" +
          "Solution: Contact contract owner to add protocols or adjust your parameters."
        );
      } else if (executeError.message && executeError.message.includes("revert")) {
        const reason = executeError.reason || executeError.data?.message || "Unknown reason";
        throw new Error("Transaction reverted: " + reason + "\n\nThis usually means:\n" +
          "1. No protocols are registered in the contract\n" +
          "2. Strategy parameters don't match any available protocols\n" +
          "3. Contract needs to be properly initialized by owner");
      } else if (executeError.message && executeError.message.includes("nonce")) {
        throw new Error("Nonce error. Please reset your MetaMask account or try again.");
      } else {
        throw new Error("Transaction failed: " + (executeError.message || "Unknown error. Please try again."));
      }
    }
    
    // Step 3: Wait for confirmation
    console.log("⏳ Waiting for blockchain confirmation...");
    console.log("💡 This may take 10-30 seconds on Arc Testnet");
    
    let receipt;
    try {
      receipt = await tx.wait();
      
      console.log("\n✅ Route executed successfully!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📍 Block Number:", receipt.blockNumber);
      console.log("⛽ Gas Used:", receipt.gasUsed.toString());
      console.log("✅ Status:", receipt.status === 1 ? "Success" : "Failed");
      console.log("💰 Amount Invested:", amount, "USDC");
      console.log("📊 Strategy applied with target yield:", route.expected_yield || route.expectedYield, "%");
      console.log("🔗 Explorer Link:");
      console.log("   https://testnet.arcscan.app/tx/" + tx.hash);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n💡 Note: The contract distributed your USDC across protocols based on your strategy.");
      console.log("💡 Use 'Get Active Route' to see the actual distribution.");
      
    } catch (waitError) {
      console.error("⚠️ Wait error:", waitError);
      // Even if wait fails, the transaction might have succeeded
      console.log("⚠️ Confirmation wait failed, but transaction may have succeeded");
      console.log("🔗 Check transaction status:");
      console.log("   https://testnet.arcscan.app/tx/" + tx.hash);
      
      return {
        success: true,
        hash: tx.hash,
        blockNumber: null,
        gasUsed: null,
        note: "Transaction sent but confirmation pending. Check explorer."
      };
    }
    
    return { 
      success: true, 
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    };
    
  } catch (error) {
    console.error("❌ EXECUTE_ROUTE Error:", error);
    
    // Provide user-friendly error messages
    let errorMessage = "Failed to execute route: ";
    
    if (error.message) {
      errorMessage += error.message;
    } else if (error.code === "NETWORK_ERROR") {
      errorMessage += "Network connection issue. Please check your connection and try again.";
    } else {
      errorMessage += "Unknown error occurred. Please try again.";
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Get all protocols
 */
export const GET_ALL_PROTOCOLS = async () => {
  try {
    const contract = await ROUTER_CONTRACT();
    if (!contract) throw new Error("Failed to get router contract");

    // Try with fallback RPC if MetaMask fails
    try {
      const protocols = await contract.getAllProtocols();
      return protocols.map(p => ({
        address: p.protocolAddress,
        name: p.name,
        riskScore: Number(p.riskScore),
        currentYield: Number(p.currentYield) / 100, // Convert to percentage
        totalDeposited: ethers.formatEther(p.totalDeposited),
        isActive: p.isActive,
      }));
    } catch (metaMaskError) {
      console.log("⚠️ MetaMask RPC failed, trying fallback...");
      
      const fallbackRpcUrl = networks[DEFAULT_NETWORK].rpcUrls[1] || networks[DEFAULT_NETWORK].rpcUrls[0];
      const fallbackProvider = new ethers.JsonRpcProvider(fallbackRpcUrl);
      const fallbackContract = fetchContract(ROUTER_ADDRESS, ROUTER_ABI, fallbackProvider);
      
      const protocols = await fallbackContract.getAllProtocols();
      console.log("✅ Protocols retrieved via fallback RPC");
      
      return protocols.map(p => ({
        address: p.protocolAddress,
        name: p.name,
        riskScore: Number(p.riskScore),
        currentYield: Number(p.currentYield) / 100,
        totalDeposited: ethers.formatEther(p.totalDeposited),
        isActive: p.isActive,
      }));
    }
  } catch (error) {
    console.error("❌ GET_ALL_PROTOCOLS Error:", error);
    return [];
  }
};

/**
 * Get user's active route
 */
export const GET_ACTIVE_ROUTE = async () => {
  try {
    const contract = await ROUTER_CONTRACT();
    if (!contract) return null;

    // Check wallet connection - auto-connect if not connected
    let address = await CHECK_WALLET_CONNECTED();
    if (!address) {
      console.log("⚠️ Wallet not connected. Attempting to connect...");
      const connectResult = await CONNECT_WALLET();
      
      if (!connectResult || !connectResult.address) {
        console.log("⚠️ Wallet connection cancelled or failed");
        return null;
      }
      
      address = connectResult.address;
      console.log("✅ Wallet connected successfully:", address);
    }

    const [protocols, amounts, expectedYield, riskScore, timestamp] = 
      await contract.getActiveRoute(address);

    if (timestamp.toString() === "0") {
      return null; // No active route
    }

    return {
      protocols,
      amounts: amounts.map(a => ethers.formatEther(a)),
      expectedYield: Number(expectedYield) / 100,
      riskScore: Number(riskScore),
      timestamp: Number(timestamp),
    };
  } catch (error) {
    console.error("❌ GET_ACTIVE_ROUTE Error:", error);
    return null;
  }
};

/**
 * Check if rebalancing is needed
 */
export const SHOULD_REBALANCE = async () => {
  try {
    const contract = await ROUTER_CONTRACT();
    if (!contract) return false;

    // Check wallet connection - auto-connect if not connected
    let address = await CHECK_WALLET_CONNECTED();
    if (!address) {
      console.log("⚠️ Wallet not connected for rebalance check");
      return false;
    }

    return await contract.shouldRebalance(address);
  } catch (error) {
    console.error("❌ SHOULD_REBALANCE Error:", error);
    return false;
  }
};

/**
 * Rebalance user's positions
 */
export const REBALANCE = async () => {
  try {
    console.log("🔄 Rebalancing positions...");
    
    // Check wallet connection - auto-connect if not connected
    let address = await CHECK_WALLET_CONNECTED();
    if (!address) {
      console.log("⚠️ Wallet not connected. Attempting to connect...");
      const connectResult = await CONNECT_WALLET();
      
      if (!connectResult || !connectResult.address) {
        throw new Error("Wallet connection failed. Please connect your wallet and try again.");
      }
      
      address = connectResult.address;
      console.log("✅ Wallet connected successfully:", address);
    }
    
    const contract = await ROUTER_CONTRACT();
    if (!contract) throw new Error("Failed to get router contract");

    const tx = await contract.rebalance({
      gasLimit: 500000
    });
    
    console.log("⏳ Waiting for confirmation...");
    await tx.wait();
    
    console.log("✅ Rebalanced successfully!");
    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error("❌ REBALANCE Error:", error);
    throw error;
  }
};

/**
 * Withdraw all positions
 */
export const WITHDRAW_ALL = async () => {
  try {
    console.log("💸 Withdrawing all positions...");
    const contract = await ROUTER_CONTRACT();
    if (!contract) throw new Error("Failed to get router contract");

    const tx = await contract.withdrawAll({
      gasLimit: 500000
    });
    
    console.log("⏳ Waiting for confirmation...");
    await tx.wait();
    
    console.log("✅ Withdrawn successfully!");
    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error("❌ WITHDRAW_ALL Error:", error);
    throw error;
  }
};

// ===========================================
// PYTHON BACKEND API INTEGRATION
// ===========================================

/**
 * Python Backend API Integration
 * This bypasses the problematic MetaMask RPC by using the Python FastAPI backend
 */

const API_BASE_URL = "http://localhost:8000";

/**
 * Check if Python backend is available
 */
export const CHECK_BACKEND_HEALTH = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (data.status === "healthy") {
      console.log("✅ Python backend is healthy!");
      console.log("   RPC:", data.current_rpc);
      console.log("   Block:", data.block_number);
      return true;
    }
    return false;
  } catch (error) {
    console.log("⚠️ Python backend not available:", error.message);
    console.log("💡 Start backend: cd python_backend && python route_optimizer.py");
    return false;
  }
};

/**
 * Get all protocols via Python backend (bypasses MetaMask RPC)
 */
export const GET_ALL_PROTOCOLS_VIA_API = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/protocols`);
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        // Handle both string and object error details
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } catch (e) {
        // Ignore JSON parse error, use default message
      }
      throw new Error(errorMessage);
    }
    
    const protocols = await response.json();
    console.log(`✅ Fetched ${protocols.length} protocols via Python backend`);
    return protocols;
  } catch (error) {
    console.error("❌ GET_ALL_PROTOCOLS_VIA_API Error:", error);
    throw error;
  }
};

/**
 * Calculate optimal route via Python backend (bypasses MetaMask RPC)
 * This is the main function that solves the RPC errors!
 */
export const CALCULATE_OPTIMAL_ROUTE_VIA_API = async (amount, riskLevel, targetYield, duration) => {
  try {
    // Validate inputs before sending to API
    if (!amount || amount === null || amount === undefined || amount === '' || amount === 0) {
      throw new Error("Please enter a valid amount greater than 0");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Please enter a valid amount greater than 0");
    }

    const parsedRisk = parseInt(riskLevel);
    if (isNaN(parsedRisk) || parsedRisk < 0 || parsedRisk > 100) {
      throw new Error("Risk level must be between 0 and 100");
    }

    const parsedYield = parseFloat(targetYield);
    if (isNaN(parsedYield) || parsedYield <= 0) {
      throw new Error("Target yield must be greater than 0");
    }

    const parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      throw new Error("Duration must be greater than 0 days");
    }

    console.log("🐍 Calculating route via Python backend...");
    console.log("- Amount:", parsedAmount, "USDC");
    console.log("- Risk Level:", parsedRisk);
    console.log("- Target Yield:", parsedYield, "%");
    console.log("- Duration:", parsedDuration, "days");

    const response = await fetch(`${API_BASE_URL}/calculate-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: parsedAmount,
        risk_level: parsedRisk,
        target_yield: parsedYield,
        duration: parsedDuration
      })
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        // Handle both string and object error details
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } catch (jsonError) {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch (textError) {
          // Use default error message
        }
      }
      throw new Error(errorMessage);
    }

    const route = await response.json();
    
    console.log("✅ Route calculated successfully via Python backend!");
    console.log("📊 Selected", route.protocols.length, "protocols");
    console.log("📈 Expected Yield:", route.expected_yield + "%");
    console.log("⚠️ Risk Score:", route.risk_score);
    
    return route;

  } catch (error) {
    console.error("❌ CALCULATE_OPTIMAL_ROUTE_VIA_API Error:", error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(`Cannot connect to Python backend at ${API_BASE_URL}. Please ensure the backend is running (cd python_backend && ./start_backend.sh)`);
    }
    
    // Ensure we throw a readable error message
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'object' && error !== null) {
      throw new Error(JSON.stringify(error));
    } else {
      throw new Error(String(error));
    }
  }
};

/**
 * Check user's token allowance via Python backend
 */
export const CHECK_ALLOWANCE_VIA_API = async (userAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/allowance/${userAddress}`);
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        // Handle both string and object error details
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } catch (e) {
        // Ignore JSON parse error, use default message
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("✅ Allowance:", data.allowance_ether, "USDC");
    return data;
  } catch (error) {
    console.error("❌ CHECK_ALLOWANCE_VIA_API Error:", error);
    throw error;
  }
};

/**
 * Check user's token balance via Python backend
 */
export const CHECK_BALANCE_VIA_API = async (userAddress) => {
  try {
    const response = await fetch(`${API_BASE_URL}/balance/${userAddress}`);
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        // Handle both string and object error details
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } catch (e) {
        // Ignore JSON parse error, use default message
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("✅ Balance:", data.balance_ether, "USDC");
    return data;
  } catch (error) {
    console.error("❌ CHECK_BALANCE_VIA_API Error:", error);
    throw error;
  }
};
