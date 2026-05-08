import hre from "hardhat";
import fs from "fs";

async function main() {
  console.log("🚀 Deploying SmartDeFiRouter...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);

  // USDC Token address on Arc Testnet (your ARCToken)
  const USDC_TOKEN = "0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2";

  // Deploy SmartDeFiRouter
  const SmartDeFiRouter = await hre.ethers.getContractFactory("SmartDeFiRouter");
  const router = await SmartDeFiRouter.deploy(USDC_TOKEN);
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log("✅ SmartDeFiRouter deployed to:", routerAddress);

  // Add some mock protocols for testing
  console.log("\n📦 Adding mock protocols...");

  const protocols = [
    {
      address: "0x1111111111111111111111111111111111111111", // Mock address
      name: "Arc Lending Protocol",
      riskScore: 25,
      currentYield: 850, // 8.5% APY in basis points
    },
    {
      address: "0x2222222222222222222222222222222222222222",
      name: "Arc Staking Pool",
      riskScore: 30,
      currentYield: 720, // 7.2% APY
    },
    {
      address: "0x3333333333333333333333333333333333333333",
      name: "Arc Liquidity Pool",
      riskScore: 45,
      currentYield: 910, // 9.1% APY
    },
    {
      address: "0x4444444444444444444444444444444444444444",
      name: "Arc Yield Vault",
      riskScore: 20,
      currentYield: 650, // 6.5% APY
    },
    {
      address: "0x5555555555555555555555555555555555555555",
      name: "Arc Strategy Pool",
      riskScore: 35,
      currentYield: 780, // 7.8% APY
    },
  ];

  for (const protocol of protocols) {
    const tx = await router.addProtocol(
      protocol.address,
      protocol.name,
      protocol.riskScore,
      protocol.currentYield
    );
    await tx.wait();
    console.log(`✅ Added: ${protocol.name} (Yield: ${protocol.currentYield / 100}%, Risk: ${protocol.riskScore}/100)`);
  }

  console.log("\n✅ Deployment complete!");
  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Router Address:", routerAddress);
  console.log("USDC Token:", USDC_TOKEN);
  console.log("Protocols Added:", protocols.length);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  console.log("\n💡 Next Steps:");
  console.log("1. Update context/constants.js with router address");
  console.log("2. Approve USDC spending for the router contract");
  console.log("3. Test route calculation and execution");

  // Save deployment info
  const deploymentInfo = {
    routerAddress: routerAddress,
    usdcToken: USDC_TOKEN,
    network: "arc_testnet",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    protocols: protocols,
  };

  fs.writeFileSync(
    "deployment-router.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to deployment-router.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
