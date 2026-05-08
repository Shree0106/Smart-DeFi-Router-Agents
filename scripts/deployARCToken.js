import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🚀 Starting ARCToken deployment on Arc Testnet...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  
  console.log("📝 Deploying contracts with the account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatUnits(balance, 6), "USDC\n");

  // Check if we have enough balance
  if (balance === 0n) {
    console.error("❌ Error: Insufficient USDC for gas fees!");
    console.log("📌 Get test USDC from: https://faucet.circle.com");
    console.log("📌 Network: Arc Testnet");
    console.log("📌 Your address:", deployer.address);
    process.exit(1);
  }

  // Get the contract factory
  console.log("📦 Compiling ARCToken contract...");
  const ARCToken = await ethers.getContractFactory("contracts/ARCToken.sol:ARCToken");

  // Deploy the contract
  console.log("🔨 Deploying ARCToken...");
  const arcToken = await ARCToken.deploy();

  // Wait for deployment
  await arcToken.waitForDeployment();
  
  const contractAddress = await arcToken.getAddress();

  console.log("\n✅ ARCToken deployed successfully!");
  console.log("═══════════════════════════════════════════════════════");
  console.log("📍 Contract Address:", contractAddress);
  console.log("👤 Deployer Address:", deployer.address);
  console.log("🌐 Network: Arc Testnet");
  console.log("🔗 Chain ID: 5042002");
  console.log("═══════════════════════════════════════════════════════\n");

  // Get token info
  console.log("📊 Token Information:");
  const name = await arcToken.name();
  const symbol = await arcToken.symbol();
  const decimals = await arcToken.decimals();
  const totalSupply = await arcToken.totalSupply();
  const maxSupply = await arcToken.MAX_SUPPLY();
  const owner = await arcToken.owner();
  
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Initial Supply:", ethers.formatEther(totalSupply), "KRN");
  console.log("   Max Supply:", ethers.formatEther(maxSupply), "KRN");
  console.log("   Owner:", owner);
  console.log("   Deployer Balance:", ethers.formatEther(await arcToken.balanceOf(deployer.address)), "KRN\n");

  // Verification info
  console.log("🔍 Verify on Explorer:");
  console.log(`   https://testnet.arcscan.app/address/${contractAddress}\n`);

  console.log("🦊 Add to MetaMask:");
  console.log(`   Token Address: ${contractAddress}`);
  console.log("   Token Symbol: KRN");
  console.log("   Decimals: 18\n");

  console.log("📝 Update your frontend:");
  console.log(`   export const TOKEN_ADDRESS = "${contractAddress}";\n`);

  // Save deployment info
  const deploymentInfo = {
    network: "Arc Testnet",
    chainId: 5042002,
    contractName: "ARCToken",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    tokenInfo: {
      name: name,
      symbol: symbol,
      decimals: Number(decimals),
      initialSupply: ethers.formatEther(totalSupply),
      maxSupply: ethers.formatEther(maxSupply)
    },
    explorer: `https://testnet.arcscan.app/address/${contractAddress}`,
    transactionHash: arcToken.deploymentTransaction()?.hash
  };

  console.log("💾 Deployment info saved!");
  console.log("\n" + JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✨ Deployment completed successfully! ✨\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
