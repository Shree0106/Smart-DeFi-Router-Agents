const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting deployment...");
  console.log("Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy ERC20 Token
  console.log("\n1. Deploying ERC20 Token...");
  const ERC20 = await hre.ethers.getContractFactory("ERC20");

  // Token parameters - adjust these as needed
  const tokenName = "ICO Token";
  const tokenSymbol = "ICOT";
  const initialSupply = hre.ethers.parseEther("1000000"); // 1 million tokens

  const token = await ERC20.deploy(tokenName, tokenSymbol, initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("✅ ERC20 Token deployed to:", tokenAddress);
  console.log("   Name:", tokenName);
  console.log("   Symbol:", tokenSymbol);
  console.log("   Initial Supply:", hre.ethers.formatEther(initialSupply));

  // Deploy TokenICO Contract
  console.log("\n2. Deploying TokenICO Contract...");
  const TokenICO = await hre.ethers.getContractFactory("TokenICO");

  // ICO parameters - adjust these as needed
  const tokenPrice = hre.ethers.parseEther("0.001"); // Price per token in ETH

  const tokenICO = await TokenICO.deploy(tokenAddress, tokenPrice);
  await tokenICO.waitForDeployment();
  const tokenICOAddress = await tokenICO.getAddress();

  console.log("✅ TokenICO Contract deployed to:", tokenICOAddress);
  console.log("   Token Price:", hre.ethers.formatEther(tokenPrice), "ETH");

  // Transfer tokens to ICO contract
  console.log("\n3. Transferring tokens to ICO contract...");
  const transferAmount = hre.ethers.parseEther("500000"); // Transfer 500k tokens to ICO
  const transferTx = await token.transfer(tokenICOAddress, transferAmount);
  await transferTx.wait();
  console.log(
    "✅ Transferred",
    hre.ethers.formatEther(transferAmount),
    "tokens to ICO contract"
  );

  // Verify balances
  const icoBalance = await token.balanceOf(tokenICOAddress);
  console.log(
    "   ICO Contract Token Balance:",
    hre.ethers.formatEther(icoBalance)
  );

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(80));
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("ERC20 Token:  ", tokenAddress);
  console.log("TokenICO:     ", tokenICOAddress);

  console.log("\n" + "=".repeat(80));
  console.log("NEXT STEPS:");
  console.log("=".repeat(80));
  console.log("1. Update context/constants.js with these addresses:");
  console.log(`   export const TOKEN_ADDRESS = "${tokenAddress}";`);
  console.log(`   export const CONTRACT_ADDRESS = "${tokenICOAddress}";`);
  console.log("\n2. Verify contracts on block explorer:");
  if (hre.network.name === "arc_testnet") {
    console.log(
      `   Token: https://testnet.arcscan.app/address/${tokenAddress}`
    );
    console.log(
      `   ICO:   https://testnet.arcscan.app/address/${tokenICOAddress}`
    );
  } else if (hre.network.name === "localhost") {
    console.log(`   Token: http://localhost:8545/address/${tokenAddress}`);
    console.log(`   ICO:   http://localhost:8545/address/${tokenICOAddress}`);
  }
  console.log("\n3. Refresh your DApp and connect your wallet!");
  console.log("=".repeat(80) + "\n");

  // Save deployment info to file
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      token: {
        address: tokenAddress,
        name: tokenName,
        symbol: tokenSymbol,
        initialSupply: hre.ethers.formatEther(initialSupply),
      },
      tokenICO: {
        address: tokenICOAddress,
        tokenPrice: hre.ethers.formatEther(tokenPrice),
      },
    },
  };

  const deploymentDir = "./deployments";
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir);
  }

  const filename = `${deploymentDir}/${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📝 Deployment info saved to: ${filename}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
