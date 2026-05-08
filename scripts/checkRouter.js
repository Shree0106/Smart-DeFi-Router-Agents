/**
 * Script to check SmartDeFiRouter status
 * Run: npx hardhat run scripts/checkRouter.js --network arc_testnet
 */

const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking SmartDeFiRouter Status...\n");

  const ROUTER_ADDRESS = "0x2762ce47D9A3C74FD8B959802e367faD05c2B2a0";
  
  console.log("📍 Router Address:", ROUTER_ADDRESS);
  
  try {
    const SmartDeFiRouter = await hre.ethers.getContractFactory("SmartDeFiRouter");
    const router = SmartDeFiRouter.attach(ROUTER_ADDRESS);
    
    // Get owner
    const owner = await router.owner();
    console.log("👤 Contract Owner:", owner);
    
    // Get protocol count
    const protocolCount = await router.protocolCount();
    console.log("📊 Protocol Count:", protocolCount.toString());
    
    if (protocolCount == 0) {
      console.log("\n❌ NO PROTOCOLS REGISTERED!");
      console.log("\n💡 Solution:");
      console.log("   Run: npx hardhat run scripts/addProtocols.js --network arc_testnet");
      console.log("   (Must be run by the contract owner)");
    } else {
      console.log("\n✅ Protocols are registered!\n");
      console.log("📋 Protocols:");
      
      for (let i = 0; i < protocolCount; i++) {
        const protocol = await router.protocols(i);
        console.log(`\n  ${i + 1}. ${protocol.name}`);
        console.log(`     Address: ${protocol.protocolAddress}`);
        console.log(`     Risk Score: ${protocol.riskScore}/100`);
        console.log(`     Yield: ${protocol.currentYield / 100}% APY`);
        console.log(`     Active: ${protocol.isActive}`);
        console.log(`     Total Deposited: ${hre.ethers.formatEther(protocol.totalDeposited)} USDC`);
      }
      
      console.log("\n✅ Router is ready to use!");
    }
    
    // Get TVL
    const tvl = await router.totalValueLocked();
    console.log("\n💰 Total Value Locked:", hre.ethers.formatEther(tvl), "USDC");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nPossible issues:");
    console.error("  1. Contract not deployed at this address");
    console.error("  2. Network connection issues");
    console.error("  3. Wrong network selected");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
