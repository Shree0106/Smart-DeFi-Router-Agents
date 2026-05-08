import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🔍 Checking ICO Contract Status...\n");

  const ICO_ADDRESS = "0xAa17E6983022E9552e189D19a7aB23F4b6D3E347";
  const TOKEN_ADDRESS = "0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2";

  try {
    // Check if contract exists
    console.log("📋 Step 1: Checking if contract exists...");
    const code = await ethers.provider.getCode(ICO_ADDRESS);
    
    if (code === "0x" || code === "0x0") {
      console.log("❌ Contract NOT deployed at", ICO_ADDRESS);
      process.exit(1);
    } else {
      console.log("✅ Contract exists at", ICO_ADDRESS);
      console.log("   Code length:", code.length, "characters");
    }

    // Try to interact with contract
    console.log("\n📋 Step 2: Loading contract interface...");
    const ico = await ethers.getContractAt("TokenICO", ICO_ADDRESS);
    console.log("✅ Contract interface loaded");

    // Try calling owner (should always work)
    console.log("\n📋 Step 3: Calling owner()...");
    try {
      const owner = await ico.owner();
      console.log("✅ Owner:", owner);
    } catch (error) {
      console.log("❌ Failed to call owner():", error.message);
    }

    // Try calling tokenAddress
    console.log("\n📋 Step 4: Calling tokenAddress()...");
    try {
      const tokenAddr = await ico.tokenAddress();
      console.log("✅ Token Address:", tokenAddr);
    } catch (error) {
      console.log("❌ Failed to call tokenAddress():", error.message);
    }

    // Try calling tokenSalePrice
    console.log("\n📋 Step 5: Calling tokenSalePrice()...");
    try {
      const price = await ico.tokenSalePrice();
      console.log("✅ Token Price:", ethers.formatEther(price), "USDC");
    } catch (error) {
      console.log("❌ Failed to call tokenSalePrice():", error.message);
    }

    // Try calling soldTokens
    console.log("\n📋 Step 6: Calling soldTokens()...");
    try {
      const sold = await ico.soldTokens();
      console.log("✅ Sold Tokens:", sold.toString());
    } catch (error) {
      console.log("❌ Failed to call soldTokens():", error.message);
    }

    // Try calling getTokenDetails
    console.log("\n📋 Step 7: Calling getTokenDetails()...");
    try {
      const details = await ico.getTokenDetails();
      console.log("✅ Token Details:");
      console.log("   Name:", details[0]);
      console.log("   Symbol:", details[1]);
      console.log("   Balance:", ethers.formatEther(details[2]));
      console.log("   Supply:", ethers.formatEther(details[3]));
      console.log("   Price:", ethers.formatEther(details[4]));
      console.log("   Address:", details[5]);
    } catch (error) {
      console.log("❌ Failed to call getTokenDetails():", error.message);
      console.log("   Error code:", error.code);
      console.log("   This is the function the frontend is trying to call!");
    }

    // Check token contract
    console.log("\n📋 Step 8: Checking token contract...");
    const tokenCode = await ethers.provider.getCode(TOKEN_ADDRESS);
    if (tokenCode === "0x" || tokenCode === "0x0") {
      console.log("❌ Token NOT deployed at", TOKEN_ADDRESS);
    } else {
      console.log("✅ Token exists at", TOKEN_ADDRESS);
      
      const token = await ethers.getContractAt(
        "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
        TOKEN_ADDRESS
      );
      
      try {
        const name = await token.name();
        const symbol = await token.symbol();
        const icoBalance = await token.balanceOf(ICO_ADDRESS);
        console.log("   Name:", name);
        console.log("   Symbol:", symbol);
        console.log("   ICO Balance:", ethers.formatEther(icoBalance), "tokens");
      } catch (error) {
        console.log("   ⚠️ Could not read token details:", error.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Diagnostic Complete");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
