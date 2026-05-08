/**
 * Script to add protocols to SmartDeFiRouter
 * Run: npx hardhat run scripts/addProtocols.js --network arc_testnet
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Adding Protocols to SmartDeFiRouter...\n");

  // Get the deployed router address
  const ROUTER_ADDRESS = "0x2762ce47D9A3C74FD8B959802e367faD05c2B2a0";
  
  console.log("📍 Router Address:", ROUTER_ADDRESS);
  
  // Get the contract
  const SmartDeFiRouter = await hre.ethers.getContractFactory("SmartDeFiRouter");
  const router = SmartDeFiRouter.attach(ROUTER_ADDRESS);
  
  // Get signer
  const [owner] = await hre.ethers.getSigners();
  console.log("👤 Owner Address:", owner.address);
  
  // Check current protocol count
  try {
    const protocolCount = await router.protocolCount();
    console.log("📊 Current Protocol Count:", protocolCount.toString());
    
    if (protocolCount > 0) {
      console.log("⚠️  Protocols already exist!");
      console.log("💡 Fetching existing protocols...\n");
      
      for (let i = 0; i < protocolCount; i++) {
        const protocol = await router.protocols(i);
        console.log(`Protocol ${i}:`);
        console.log(`  Name: ${protocol.name}`);
        console.log(`  Address: ${protocol.protocolAddress}`);
        console.log(`  Risk: ${protocol.riskScore}`);
        console.log(`  Yield: ${protocol.currentYield / 100}%`);
        console.log(`  Active: ${protocol.isActive}\n`);
      }
      
      console.log("✅ Protocols are already configured!");
      return;
    }
  } catch (error) {
    console.log("⚠️  Could not read protocol count:", error.message);
  }
  
  console.log("\n📝 Adding mock protocols...\n");
  
  // Define mock protocols (since we don't have real protocol contracts)
  const mockProtocols = [
    {
      address: "0x1111111111111111111111111111111111111111",
      name: "Arc Lending Protocol",
      riskScore: 25,
      currentYield: 850 // 8.5% in basis points
    },
    {
      address: "0x2222222222222222222222222222222222222222",
      name: "Arc Staking Pool",
      riskScore: 30,
      currentYield: 720 // 7.2%
    },
    {
      address: "0x3333333333333333333333333333333333333333",
      name: "Arc Liquidity Pool",
      riskScore: 45,
      currentYield: 910 // 9.1%
    },
    {
      address: "0x4444444444444444444444444444444444444444",
      name: "Arc Yield Vault",
      riskScore: 20,
      currentYield: 650 // 6.5%
    },
    {
      address: "0x5555555555555555555555555555555555555555",
      name: "Arc Strategy Pool",
      riskScore: 35,
      currentYield: 780 // 7.8%
    },
    {
      address: "0x6666666666666666666666666666666666666666",
      name: "Arc High Yield Farm",
      riskScore: 55,
      currentYield: 1250 // 12.5%
    },
    {
      address: "0x7777777777777777777777777777777777777777",
      name: "Arc Leveraged Vault",
      riskScore: 70,
      currentYield: 1580 // 15.8%
    },
    {
      address: "0x8888888888888888888888888888888888888888",
      name: "Arc Options Strategy",
      riskScore: 85,
      currentYield: 2020 // 20.2%
    }
  ];
  
  // Add each protocol
  for (let i = 0; i < mockProtocols.length; i++) {
    const protocol = mockProtocols[i];
    
    try {
      console.log(`\n📌 Adding Protocol ${i + 1}: ${protocol.name}`);
      console.log(`   Address: ${protocol.address}`);
      console.log(`   Risk Score: ${protocol.riskScore}/100`);
      console.log(`   Yield: ${protocol.currentYield / 100}%`);
      
      const tx = await router.addProtocol(
        protocol.address,
        protocol.name,
        protocol.riskScore,
        protocol.currentYield,
        { gasLimit: 300000 }
      );
      
      console.log(`   ⏳ Transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ Protocol added successfully!`);
      
    } catch (error) {
      console.error(`   ❌ Failed to add protocol:`, error.message);
      
      if (error.message.includes("Only owner")) {
        console.error("\n❌ ERROR: You are not the contract owner!");
        console.error("   Only the owner can add protocols.");
        console.error("   Current signer:", owner.address);
        break;
      }
    }
  }
  
  // Verify protocols were added
  console.log("\n\n📊 Verifying protocols...");
  const finalCount = await router.protocolCount();
  console.log(`✅ Total Protocols: ${finalCount.toString()}`);
  
  if (finalCount > 0) {
    console.log("\n📋 All Protocols:");
    for (let i = 0; i < finalCount; i++) {
      const protocol = await router.protocols(i);
      console.log(`\n  ${i + 1}. ${protocol.name}`);
      console.log(`     Risk: ${protocol.riskScore}/100 | Yield: ${protocol.currentYield / 100}% | Active: ${protocol.isActive}`);
    }
    
    console.log("\n\n✅ SUCCESS! Protocols are now configured!");
    console.log("🎉 You can now use the SmartDeFiRouter to execute routes!");
  } else {
    console.log("\n❌ No protocols were added. Please check the errors above.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
