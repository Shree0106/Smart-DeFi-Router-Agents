import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🚀 Setting up TokenICO contract on Arc Testnet...\n");

  // Contract addresses (update these if needed)
  const TOKEN_ICO_ADDRESS = "0xAa17E6983022E9552e189D19a7aB23F4b6D3E347"; // NEW ICO address
  const TOKEN_ADDRESS = "0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2";
  const TOKEN_PRICE = ethers.parseEther("0.001"); // 0.001 USDC per token

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Setup initiated by:", deployer.address);

  // Get the TokenICO contract instance
  const tokenICO = await ethers.getContractAt("TokenICO", TOKEN_ICO_ADDRESS);
  
  // Check current owner
  const owner = await tokenICO.owner();
  console.log("👤 Contract owner:", owner);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("❌ ERROR: You are not the contract owner!");
    console.log("   Only the owner can setup the ICO contract.");
    console.log("   Current owner:", owner);
    console.log("   Your address:", deployer.address);
    process.exit(1);
  }

  console.log("\n📋 Step 1: Checking current configuration...");
  
  // Check current token address
  let currentTokenAddress;
  try {
    currentTokenAddress = await tokenICO.tokenAddress();
    console.log("   Current token address:", currentTokenAddress);
  } catch (error) {
    console.log("   ⚠️ Could not read token address");
  }

  // Check current token price
  let currentTokenPrice;
  try {
    currentTokenPrice = await tokenICO.tokenSalePrice();
    console.log("   Current token price:", ethers.formatEther(currentTokenPrice), "USDC");
  } catch (error) {
    console.log("   ⚠️ Could not read token price");
  }

  // Step 2: Update token address if needed
  if (!currentTokenAddress || currentTokenAddress === ethers.ZeroAddress) {
    console.log("\n📋 Step 2: Setting token address...");
    console.log("   Token address:", TOKEN_ADDRESS);
    
    const updateTokenTx = await tokenICO.updateToken(TOKEN_ADDRESS);
    console.log("   ⏳ Waiting for transaction confirmation...");
    await updateTokenTx.wait();
    console.log("   ✅ Token address updated!");
  } else if (currentTokenAddress.toLowerCase() === TOKEN_ADDRESS.toLowerCase()) {
    console.log("\n✅ Step 2: Token address already set correctly");
  } else {
    console.log("\n⚠️  Step 2: Token address is set to a different address");
    console.log("   Current:", currentTokenAddress);
    console.log("   Expected:", TOKEN_ADDRESS);
    console.log("   Updating...");
    
    const updateTokenTx = await tokenICO.updateToken(TOKEN_ADDRESS);
    await updateTokenTx.wait();
    console.log("   ✅ Token address updated!");
  }

  // Step 3: Update token price if needed
  if (!currentTokenPrice || currentTokenPrice.toString() === "0") {
    console.log("\n📋 Step 3: Setting token sale price...");
    console.log("   Price:", ethers.formatEther(TOKEN_PRICE), "USDC per token");
    
    const updatePriceTx = await tokenICO.updateTokenSalePrice(TOKEN_PRICE);
    console.log("   ⏳ Waiting for transaction confirmation...");
    await updatePriceTx.wait();
    console.log("   ✅ Token price updated!");
  } else if (currentTokenPrice.toString() === TOKEN_PRICE.toString()) {
    console.log("\n✅ Step 3: Token price already set correctly");
  } else {
    console.log("\n⚠️  Step 3: Token price is different");
    console.log("   Current:", ethers.formatEther(currentTokenPrice), "USDC");
    console.log("   New:", ethers.formatEther(TOKEN_PRICE), "USDC");
    console.log("   Updating...");
    
    const updatePriceTx = await tokenICO.updateTokenSalePrice(TOKEN_PRICE);
    await updatePriceTx.wait();
    console.log("   ✅ Token price updated!");
  }

  // Step 4: Check token balance in ICO contract
  console.log("\n📋 Step 4: Checking token balance in ICO contract...");
  const token = await ethers.getContractAt("ERC20", TOKEN_ADDRESS);
  const icoBalance = await token.balanceOf(TOKEN_ICO_ADDRESS);
  console.log("   ICO contract token balance:", ethers.formatEther(icoBalance), "KRN");

  if (icoBalance.toString() === "0") {
    console.log("\n⚠️  WARNING: ICO contract has no tokens!");
    console.log("   To enable token sales, transfer tokens to the ICO contract:");
    console.log(`   Address: ${TOKEN_ICO_ADDRESS}`);
    console.log("\n   You can do this by:");
    console.log("   1. Go to https://testnet.arcscan.app/address/" + TOKEN_ADDRESS);
    console.log("   2. Use the 'Write Contract' tab");
    console.log("   3. Call 'transfer' function with:");
    console.log(`      - to: ${TOKEN_ICO_ADDRESS}`);
    console.log("      - amount: (amount in wei, e.g., 1000000000000000000000 for 1000 tokens)");
  } else {
    console.log("   ✅ ICO contract has tokens available for sale");
  }

  // Step 5: Verify configuration
  console.log("\n📋 Step 5: Verifying final configuration...");
  const finalTokenAddress = await tokenICO.tokenAddress();
  const finalTokenPrice = await tokenICO.tokenSalePrice();
  const soldTokens = await tokenICO.soldTokens();

  console.log("\n✅ ICO Contract Configuration:");
  console.log("   Contract Address:", TOKEN_ICO_ADDRESS);
  console.log("   Token Address:", finalTokenAddress);
  console.log("   Token Price:", ethers.formatEther(finalTokenPrice), "USDC per token");
  console.log("   Tokens in ICO:", ethers.formatEther(icoBalance), "KRN");
  console.log("   Sold Tokens:", soldTokens.toString(), "KRN");
  console.log("   Owner:", owner);

  console.log("\n🎉 ICO setup complete!");
  console.log("\n📝 Next steps:");
  if (icoBalance.toString() === "0") {
    console.log("   1. Transfer tokens to the ICO contract");
  }
  console.log("   2. Test the dApp by connecting your wallet");
  console.log("   3. Try buying tokens");

  console.log("\n🔗 View on Explorer:");
  console.log("   ICO Contract:", `https://testnet.arcscan.app/address/${TOKEN_ICO_ADDRESS}`);
  console.log("   Token Contract:", `https://testnet.arcscan.app/address/${TOKEN_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
