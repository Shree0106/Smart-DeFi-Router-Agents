import React, { useState, useEffect, createContext } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import {
  CHECK_WALLET_CONNECTED,
  CONNECT_WALLET,
  TOKEN_ICO_CONTRACT,
  ERC20_CONTRACT,
  ERC20,
  GET_BALANCE,
  CHECK_ACCOUNT_BALANCE,
  addTokenToMetamask,
  CONTRACT_ADDRESS,
  getCurrentNetwork,
  createFallbackContract,
  CONTRACT_ABI,
  DEFAULT_NETWORK,
  CALCULATE_OPTIMAL_ROUTE,
  CALCULATE_ROUTE,
  EXECUTE_ROUTE,
  GET_ALL_PROTOCOLS,
  GET_ACTIVE_ROUTE,
  SHOULD_REBALANCE,
  REBALANCE,
  WITHDRAW_ALL,
  CHECK_BACKEND_HEALTH,
  GET_ALL_PROTOCOLS_VIA_API,
  CALCULATE_OPTIMAL_ROUTE_VIA_API,
  CHECK_ALLOWANCE_VIA_API,
  CHECK_BALANCE_VIA_API,
  ADD_NETWORK,
  SWITCH_TO_ARC_NETWORK,
  CHECK_NETWORK_EXISTS,
} from "../context/constants";

export const TOKEN_ICO_Context = createContext();

export const TokenICOProvider = ({ children }) => {
  const DAPP_NAME = "TOKEN ICO DAPP";
  const currency = "USDC";
  const network = "arc_testnet";

  const [loader, setLoader] = useState(false);
  const [account, setAccount] = useState("");
  const [count, setCount] = useState(0);

  const notifySuccess = (message) => {
    toast.success(message, { duration: 2000 });
  };

  const notifyError = (message) => {
    toast.error(message, { duration: 4000 });
  };

  // Contract Functions
  const TOKEN_ICO = async () => {
    try {
      const address = await CHECK_WALLET_CONNECTED();
      if (!address) {
        console.log("⚠️ No wallet connected");
        return null;
      }

      setLoader(true);

      // Get current network info
      const currentNetwork = await getCurrentNetwork();
      if (currentNetwork) {
        console.log(
          `🌐 Current network: ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`
        );
      }

      // Check if on correct network (Arc Testnet)
      const expectedChainId = 5042002;
      if (currentNetwork && currentNetwork.chainId !== expectedChainId) {
        setLoader(false);
        console.log(
          `⚠️ Wrong network! Currently on ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`
        );
        console.log(`💡 Expected: Arc Testnet (Chain ID: ${expectedChainId})`);
        notifyError(
          `Wrong network! Please switch to Arc Testnet in MetaMask.`
        );
        return null;
      }

      const contract = await TOKEN_ICO_CONTRACT();

      if (!contract) {
        setLoader(false);
        console.log("⚠️ Failed to connect to contract");
        console.log("💡 Please ensure:");
        console.log("   1. You're connected to Arc Testnet (Chain ID: 5042002)");
        console.log("   2. MetaMask is unlocked and connected");
        console.log("   3. Contract is deployed at:", CONTRACT_ADDRESS);
        notifyError(
          "Failed to connect to contract. Please check your wallet connection."
        );
        return null;
      }

      // First check if token address is set
      let tokenAddr;
      let usedFallback = false;
      try {
        tokenAddr = await contract.tokenAddress();
        console.log("📍 Token address in ICO contract:", tokenAddr);
        
        if (!tokenAddr || tokenAddr === "0x0000000000000000000000000000000000000000") {
          setLoader(false);
          console.log("⚠️ Token address not set in ICO contract");
          console.log("💡 Contract owner needs to call updateToken() with token address");
          console.log("💡 Expected token address: 0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2");
          
          // Check if current user is owner
          try {
            const contractOwner = await contract.owner();
            if (address.toLowerCase() === contractOwner.toLowerCase()) {
              notifyError(
                "Token address not set. Please update the token address in the contract."
              );
            } else {
              notifyError(
                "Contract not configured. Please contact the contract owner."
              );
            }
          } catch (ownerError) {
            notifyError("Contract configuration error. Please try again.");
          }
          return null;
        }
      } catch (tokenAddrError) {
        console.log("⚠️ MetaMask contract call failed:", tokenAddrError.message);
        
        // Try with fallback RPC provider
        console.log("🔄 Trying fallback RPC for contract calls...");
        try {
          const fallbackContract = createFallbackContract(CONTRACT_ADDRESS, CONTRACT_ABI, DEFAULT_NETWORK);
          if (fallbackContract) {
            tokenAddr = await fallbackContract.tokenAddress();
            console.log("✅ Token address retrieved via fallback RPC:", tokenAddr);
            usedFallback = true;
            
            if (!tokenAddr || tokenAddr === "0x0000000000000000000000000000000000000000") {
              setLoader(false);
              notifyError("Contract not configured. Token address not set.");
              return null;
            }
          } else {
            throw new Error("Failed to create fallback contract");
          }
        } catch (fallbackError) {
          console.log("❌ Fallback RPC also failed:", fallbackError.message);
          console.log("💡 Both MetaMask and fallback RPC failed.");
          console.log("💡 Please try:");
          console.log("   1. Changing MetaMask RPC URL to: https://rpc.blockdaemon.testnet.arc.network");
          console.log("   2. Refreshing the page");
          console.log("   3. Checking Arc Testnet status");
          setLoader(false);
          notifyError("RPC connection failed. Please change MetaMask RPC URL.");
          return null;
        }
      }

      // Verify contract exists by checking if code exists at the address
      let contractExists = true;
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const code = await provider.getCode(CONTRACT_ADDRESS);

          if (code === "0x" || code === "0x0") {
            contractExists = false;
            setLoader(false);
            const networkInfo = currentNetwork
              ? `${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`
              : "current network";
            
            // Check if user is on wrong network
            const expectedChainId = 5042002; // Arc Testnet
            if (currentNetwork && currentNetwork.chainId !== expectedChainId) {
              console.log(
                `⚠️ Wrong network! Currently on ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`
              );
              console.log(`💡 Please switch to Arc Testnet (Chain ID: ${expectedChainId})`);
              notifyError(
                `Wrong network! Please switch to Arc Testnet in MetaMask.`
              );
              return null;
            }
            
            console.log(
              `⚠️ Contract not deployed at ${CONTRACT_ADDRESS} on ${networkInfo}`
            );
            console.log(`💡 Expected network: Arc Testnet`);
            console.log(
              `💡 Please deploy your contract to Arc Testnet or update the CONTRACT_ADDRESS in context/constants.js`
            );
            notifyError(
              `Contract not found on ${networkInfo}. Please deploy the contract first.`
            );
            return null;
          }
        } catch (codeCheckError) {
          console.log(
            "⚠️ Could not verify contract existence (RPC issue), continuing anyway..."
          );
          // Continue anyway - the actual contract call will fail if it doesn't exist
        }
      }

      // Now get token details
      let tokenDetails, contractOwner, soldTokens;
      
      // If we already used fallback, keep using it for remaining calls
      const contractToUse = usedFallback 
        ? createFallbackContract(CONTRACT_ADDRESS, CONTRACT_ABI, DEFAULT_NETWORK)
        : contract;
      
      if (!contractToUse) {
        setLoader(false);
        notifyError("Failed to initialize contract");
        return null;
      }

      try {
        tokenDetails = await contractToUse.getTokenDetails();
        contractOwner = await contractToUse.owner();
        soldTokens = await contractToUse.soldTokens();
        
        if (usedFallback) {
          console.log("✅ All data retrieved via fallback RPC");
          console.log("⚠️ Warning: You're using fallback RPC. Transactions will still use MetaMask.");
          console.log("💡 For better experience, change MetaMask RPC URL to: https://rpc.blockdaemon.testnet.arc.network");
        }
      } catch (detailsError) {
        console.log("❌ Failed to get contract details:", detailsError.message);
        
        // If using MetaMask failed, try fallback
        if (!usedFallback) {
          console.log("🔄 Retrying with fallback RPC...");
          try {
            const fallbackContract = createFallbackContract(CONTRACT_ADDRESS, CONTRACT_ABI, DEFAULT_NETWORK);
            if (fallbackContract) {
              tokenDetails = await fallbackContract.getTokenDetails();
              contractOwner = await fallbackContract.owner();
              soldTokens = await fallbackContract.soldTokens();
              console.log("✅ Data retrieved via fallback RPC");
              console.log("⚠️ MetaMask RPC is not working properly");
              console.log("💡 Change MetaMask RPC URL to: https://rpc.blockdaemon.testnet.arc.network");
            } else {
              throw new Error("Failed to create fallback contract");
            }
          } catch (fallbackDetailsError) {
            console.log("❌ Fallback RPC also failed:", fallbackDetailsError.message);
            setLoader(false);
            notifyError("Unable to fetch contract data. Please change MetaMask RPC URL.");
            return null;
          }
        } else {
          setLoader(false);
          notifyError("Failed to fetch contract data from fallback RPC");
          return null;
        }
      }

      const ethBal = await GET_BALANCE();
      const token = {
        tokenBal: ethers.formatEther(tokenDetails.balance.toString()),
        name: tokenDetails.name,
        symbol: tokenDetails.symbol,
        supply: ethers.formatEther(tokenDetails.supply.toString()),
        tokenPrice: ethers.formatEther(tokenDetails.tokenPrice.toString()),
        tokenAddr: tokenDetails.tokenAddr,
        matic: ethBal,
        address: address.toLowerCase(),
        owner: contractOwner.toLowerCase(),
        soldTokens: ethers.formatEther(soldTokens.toString()),
      };
      setLoader(false);
      console.log("✅ Token ICO data loaded successfully");
      return token;
    } catch (err) {
      console.log("TOKEN_ICO Error:", err);
      setLoader(false);

      // Get current network for better error messages
      let currentNetwork;
      let networkInfo = "current network";
      
      try {
        currentNetwork = await getCurrentNetwork();
        networkInfo = currentNetwork
          ? `${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`
          : "current network";
      } catch (networkError) {
        console.log("Could not get network info");
      }

      if (err.code === "CALL_EXCEPTION") {
        console.log(`❌ Contract call failed at address: ${CONTRACT_ADDRESS}`);
        console.log(`📍 Current network: ${networkInfo}`);
        
        // Check if wrong network
        if (currentNetwork && currentNetwork.chainId !== 5042002) {
          console.log(`⚠️ Wrong network detected!`);
          console.log(`💡 Expected: Arc Testnet (Chain ID: 5042002)`);
          console.log(`💡 Current: ${networkInfo}`);
          notifyError(
            `Wrong network! Please switch to Arc Testnet in MetaMask.`
          );
        } else {
          console.log(`⚠️ Contract call failed, but contract exists and is configured`);
          console.log(`💡 Possible causes:`);
          console.log(`   1. RPC endpoint issue (most likely)`);
          console.log(`   2. Try refreshing the page`);
          console.log(`   3. Try switching MetaMask RPC URL`);
          console.log(`\n💡 Alternative RPC URLs for Arc Testnet:`);
          console.log(`   - https://rpc.blockdaemon.testnet.arc.network`);
          console.log(`   - https://rpc.drpc.testnet.arc.network`);
          console.log(`   - https://rpc.quicknode.testnet.arc.network`);
          notifyError(
            `RPC connection issue. Please try refreshing or changing your MetaMask RPC URL.`
          );
        }
      } else if (err.code === "UNKNOWN_ERROR" || err.code === "NETWORK_ERROR") {
        console.log(`⚠️ RPC Error - possibly network connectivity issue`);
        notifyError(
          "Network error. Please check MetaMask connection and try again."
        );
      } else if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else {
        notifyError(
          "Failed to fetch token details. Please ensure you're connected to Arc Testnet."
        );
      }
      return null;
    }
  };

  const BUY_TOKEN = async (amount) => {
    try {
      setLoader(true);
      const address = await CHECK_WALLET_CONNECTED();
      if (!address) {
        setLoader(false);
        notifyError("Please connect your wallet first.");
        return;
      }

      const contract = await TOKEN_ICO_CONTRACT();
      if (!contract) {
        setLoader(false);
        notifyError("Failed to connect to contract.");
        return;
      }

      const tokenDetails = await contract.getTokenDetails();

      const availableTokens = ethers.formatEther(
        tokenDetails.balance.toString()
      );

      if (Number(availableTokens) < Number(amount)) {
        setLoader(false);
        notifyError(
          `Not enough tokens available. Available: ${availableTokens} tokens`
        );
        return;
      }

      const price = ethers.formatEther(tokenDetails.tokenPrice.toString());
      const payAmount = ethers.parseUnits(
        (Number(price) * Number(amount)).toString(),
        "ether"
      );

      const transaction = await contract.buyToken(Number(amount), {
        value: payAmount.toString(),
        gasLimit: 300000, // Add gas limit
      });

      await transaction.wait();
      setLoader(false);
      notifySuccess("Token Purchased Successfully!");
      window.location.reload();
    } catch (err) {
      console.log("BUY_TOKEN Error:", err);
      setLoader(false);
      
      if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        notifyError("Insufficient funds for this transaction.");
      } else if (err.code === "CALL_EXCEPTION") {
        notifyError("Transaction failed. Please check your balance and try again.");
      } else {
        notifyError("Transaction Failed! Please try again.");
      }
    }
  };

  const TOKEN_WITHDRAW = async () => {
    try {
      setLoader(true);
      const address = await CHECK_WALLET_CONNECTED();
      if (!address) {
        setLoader(false);
        notifyError("Please connect your wallet first.");
        return;
      }

      const contract = await TOKEN_ICO_CONTRACT();
      if (!contract) {
        setLoader(false);
        notifyError("Failed to connect to contract.");
        return;
      }

      const tokenDetails = await contract.getTokenDetails();
      const availableToken = ethers.formatEther(
        tokenDetails.balance.toString()
      );

      if (Number(availableToken) <= 0) {
        setLoader(false);
        notifyError("No tokens available to withdraw");
        return;
      }

      const transaction = await contract.withdrawAllTokens({
        gasLimit: 300000,
      });
      await transaction.wait();
      setLoader(false);
      notifySuccess("Transaction completed successfully!");
      window.location.reload();
    } catch (err) {
      console.log("TOKEN_WITHDRAW Error:", err);
      setLoader(false);
      
      if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else if (err.message && err.message.includes("Ownable: caller is not the owner")) {
        notifyError("Only the contract owner can withdraw tokens.");
      } else {
        notifyError("Withdrawal failed! Please try again.");
      }
    }
  };

  const UPDATE_TOKEN = async (_address) => {
    try {
      if (!_address || !ethers.isAddress(_address)) {
        notifyError("Invalid token address provided.");
        return;
      }

      setLoader(true);
      const address = await CHECK_WALLET_CONNECTED();
      if (!address) {
        setLoader(false);
        notifyError("Please connect your wallet first.");
        return;
      }

      const contract = await TOKEN_ICO_CONTRACT();
      if (!contract) {
        setLoader(false);
        notifyError("Failed to connect to contract.");
        return;
      }

      const transaction = await contract.updateToken(_address, {
        gasLimit: 200000,
      });
      await transaction.wait();
      setLoader(false);
      notifySuccess("Token Updated Successfully!");
      window.location.reload();
    } catch (err) {
      console.log("UPDATE_TOKEN Error:", err);
      setLoader(false);
      
      if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else if (err.message && err.message.includes("Ownable: caller is not the owner")) {
        notifyError("Only the contract owner can update the token.");
      } else {
        notifyError("Token update failed! Please try again.");
      }
    }
  };

  const UPDATE_TOKEN_PRICE = async (price) => {
    try {
      if (!price || Number(price) <= 0) {
        notifyError("Invalid price. Please enter a valid amount.");
        return;
      }

      setLoader(true);
      const address = await CHECK_WALLET_CONNECTED();
      if (!address) {
        setLoader(false);
        notifyError("Please connect your wallet first.");
        return;
      }

      const contract = await TOKEN_ICO_CONTRACT();
      if (!contract) {
        setLoader(false);
        notifyError("Failed to connect to contract.");
        return;
      }

      const payAmount = ethers.parseUnits(price.toString(), "ether");
      const transaction = await contract.updateTokenSalePrice(payAmount, {
        gasLimit: 200000,
      });
      await transaction.wait();
      setLoader(false);
      notifySuccess("Price Updated Successfully!");
      window.location.reload();
    } catch (err) {
      console.log("UPDATE_TOKEN_PRICE Error:", err);
      setLoader(false);
      
      if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else if (err.message && err.message.includes("Ownable: caller is not the owner")) {
        notifyError("Only the contract owner can update the price.");
      } else {
        notifyError("Price update failed! Please try again.");
      }
    }
  };

  const DONATE = async (amount) => {
    try {
      if (!amount || Number(amount) <= 0) {
        notifyError("Invalid amount. Please enter a valid donation amount.");
        return;
      }

      setLoader(true);
      const address = await CHECK_WALLET_CONNECTED();
      if (!address) {
        setLoader(false);
        notifyError("Please connect your wallet first.");
        return;
      }

      const contract = await TOKEN_ICO_CONTRACT();
      if (!contract) {
        setLoader(false);
        notifyError("Failed to connect to contract.");
        return;
      }

      const payAmount = ethers.parseUnits(amount.toString(), "ether");
      const transaction = await contract.transferToOwner(payAmount, {
        value: payAmount.toString(),
        gasLimit: 300000,
      });
      await transaction.wait();
      setLoader(false);
      notifySuccess("Donation successful!");
      window.location.reload();
    } catch (err) {
      console.log("DONATE Error:", err);
      setLoader(false);
      
      if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        notifyError("Insufficient funds for this donation.");
      } else {
        notifyError("Donation failed! Please try again.");
      }
    }
  };

  const TRANSFER_ETHER = async (transfer) => {
    try {
      const { _receiver, _address } = transfer;
      
      if (!_receiver || Number(_receiver) <= 0) {
        notifyError("Invalid amount. Please enter a valid amount to transfer.");
        return;
      }

      if (!_address || !ethers.isAddress(_address)) {
        notifyError("Invalid recipient address.");
        return;
      }

      setLoader(true);
      const address_from = await CHECK_WALLET_CONNECTED();
      if (!address_from) {
        setLoader(false);
        notifyError("Please connect your wallet first.");
        return;
      }

      const contract = await TOKEN_ICO_CONTRACT();
      if (!contract) {
        setLoader(false);
        notifyError("Failed to connect to contract.");
        return;
      }

      const payAmount = ethers.parseUnits(_receiver.toString(), "ether");
      const transaction = await contract.transferEther(_address, payAmount, {
        value: payAmount.toString(),
        gasLimit: 300000,
      });
      await transaction.wait();
      setLoader(false);
      notifySuccess("Transfer successful!");
      window.location.reload();
    } catch (err) {
      console.log("TRANSFER_ETHER Error:", err);
      setLoader(false);
      
      if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else if (err.code === "INSUFFICIENT_FUNDS") {
        notifyError("Insufficient funds for this transfer.");
      } else {
        notifyError("Transfer failed! Please try again.");
      }
    }
  };

  const TRANSFER_TOKEN = async (transfer) => {
    try {
      const { _tokenAddress, _sendTo, _amount } = transfer;
      
      if (!_tokenAddress || !ethers.isAddress(_tokenAddress)) {
        notifyError("Invalid token address.");
        return;
      }

      if (!_sendTo || !ethers.isAddress(_sendTo)) {
        notifyError("Invalid recipient address.");
        return;
      }

      if (!_amount || Number(_amount) <= 0) {
        notifyError("Invalid amount. Please enter a valid amount to transfer.");
        return;
      }

      setLoader(true);
      const address_from = await CHECK_WALLET_CONNECTED();
      if (!address_from) {
        setLoader(false);
        notifyError("Please connect your wallet first.");
        return;
      }

      const contract = await ERC20_CONTRACT(_tokenAddress);
      if (!contract) {
        setLoader(false);
        notifyError("Failed to connect to token contract.");
        return;
      }

      const payAmount = ethers.parseUnits(_amount.toString(), "ether");
      const transaction = await contract.transfer(_sendTo, payAmount, {
        gasLimit: 200000,
      });
      await transaction.wait();
      setLoader(false);
      notifySuccess("Token transfer successful!");
      window.location.reload();
    } catch (err) {
      console.log("TRANSFER_TOKEN Error:", err);
      setLoader(false);
      
      if (err.code === "ACTION_REJECTED") {
        notifyError("Transaction was rejected by user.");
      } else if (err.code === "INSUFFICIENT_FUNDS" || err.message?.includes("insufficient balance")) {
        notifyError("Insufficient token balance for this transfer.");
      } else {
        notifyError("Token transfer failed! Please try again.");
      }
    }
  };

  return (
    <TOKEN_ICO_Context.Provider
      value={{
        TOKEN_ICO,
        BUY_TOKEN,
        TOKEN_WITHDRAW,
        UPDATE_TOKEN,
        UPDATE_TOKEN_PRICE,
        DONATE,
        TRANSFER_ETHER,
        TRANSFER_TOKEN,
        CONNECT_WALLET,
        ERC20,
        CHECK_ACCOUNT_BALANCE,
        setAccount,
        setLoader,
        addTokenToMetamask,
        currency,
        account,
        loader,
        DAPP_NAME,
        network,
        // Router functions
        CALCULATE_OPTIMAL_ROUTE,
        CALCULATE_ROUTE,
        EXECUTE_ROUTE,
        GET_ALL_PROTOCOLS,
        GET_ACTIVE_ROUTE,
        SHOULD_REBALANCE,
        REBALANCE,
        WITHDRAW_ALL,
        // Python Backend API functions (No RPC errors!)
        CHECK_BACKEND_HEALTH,
        GET_ALL_PROTOCOLS_VIA_API,
        CALCULATE_OPTIMAL_ROUTE_VIA_API,
        CHECK_ALLOWANCE_VIA_API,
        CHECK_BALANCE_VIA_API,
        // Network management functions
        ADD_NETWORK,
        SWITCH_TO_ARC_NETWORK,
        CHECK_NETWORK_EXISTS,
      }}
    >
      {children}
    </TOKEN_ICO_Context.Provider>
  );
};
