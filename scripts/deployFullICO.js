import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🚀 Deploying complete ICO system to Arc Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatUnits(balance, 6), "USDC\n");

  if (balance === 0n) {
    console.log("❌ ERROR: No USDC balance!");
    console.log("💡 Get free USDC from: https://faucet.circle.com");
    process.exit(1);
  }

  // Step 1: Deploy or use existing ARCToken
  const EXISTING_TOKEN = "0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2";
  let tokenAddress = EXISTING_TOKEN;
  
  console.log("📋 Step 1: Checking ARCToken...");
  const code = await ethers.provider.getCode(EXISTING_TOKEN);
  
  if (code === "0x") {
    console.log("   ⚠️ Token not found at", EXISTING_TOKEN);
    console.log("   Deploying new ARCToken...");
    
    const Token = await ethers.getContractFactory("ARCToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
    
    console.log("   ✅ ARCToken deployed to:", tokenAddress);
  } else {
    console.log("   ✅ Using existing ARCToken at:", tokenAddress);
  }

  // Step 2: Deploy new TokenICO
  console.log("\n📋 Step 2: Deploying TokenICO contract...");
  const TokenICO = await ethers.getContractFactory("TokenICO");
  const tokenICO = await TokenICO.deploy();
  await tokenICO.waitForDeployment();
  
  const icoAddress = await tokenICO.getAddress();
  console.log("   ✅ TokenICO deployed to:", icoAddress);

  // Step 3: Configure ICO
  console.log("\n📋 Step 3: Configuring TokenICO...");
  
  // Set token address
  console.log("   Setting token address...");
  const setTokenTx = await tokenICO.updateToken(tokenAddress);
  await setTokenTx.wait();
  console.log("   ✅ Token address set");

  // Set token price (0.001 USDC per token)
  const tokenPrice = ethers.parseEther("0.001");
  console.log("   Setting token price to 0.001 USDC...");
  const setPriceTx = await tokenICO.updateTokenSalePrice(tokenPrice);
  await setPriceTx.wait();
  console.log("   ✅ Token price set");

  // Step 4: Transfer tokens to ICO
  console.log("\n📋 Step 4: Transferring tokens to ICO contract...");
  const token = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20", tokenAddress);
  const tokenBalance = await token.balanceOf(deployer.address);
  console.log("   Your token balance:", ethers.formatEther(tokenBalance), "KRN");

  if (tokenBalance > 0n) {
    // Transfer half to ICO contract
    const transferAmount = tokenBalance / 2n;
    console.log("   Transferring", ethers.formatEther(transferAmount), "KRN to ICO...");
    const transferTx = await token.transfer(icoAddress, transferAmount);
    await transferTx.wait();
    console.log("   ✅ Tokens transferred");
  } else {
    console.log("   ⚠️ No tokens to transfer");
  }

  // Step 5: Verify setup
  console.log("\n📋 Step 5: Verifying configuration...");
  const icoTokenAddress = await tokenICO.tokenAddress();
  const icoTokenPrice = await tokenICO.tokenSalePrice();
  const icoTokenBalance = await token.balanceOf(icoAddress);
  const owner = await tokenICO.owner();

  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📝 Contract Addresses:");
  console.log("   ARCToken (KRN):", tokenAddress);
  console.log("   TokenICO:", icoAddress);
  console.log("   Owner:", owner);
  
  console.log("\n📊 ICO Configuration:");
  console.log("   Token:", icoTokenAddress);
  console.log("   Price:", ethers.formatEther(icoTokenPrice), "USDC per token");
  console.log("   Available Tokens:", ethers.formatEther(icoTokenBalance), "KRN");

  console.log("\n🔗 View on Explorer:");
  console.log("   Token:", `https://testnet.arcscan.app/address/${tokenAddress}`);
  console.log("   ICO:", `https://testnet.arcscan.app/address/${icoAddress}`);

  console.log("\n📝 Update these addresses in your config:");
  console.log("   File: context/constants.js");
  console.log("   ");
  console.log("   export const CONTRACT_ADDRESSES = {");
  console.log("     arc_testnet: {");
  console.log(`       TOKEN_ICO: "${icoAddress}",`);
  console.log(`       TOKEN: "${tokenAddress}",`);
  console.log("     },");
  console.log("   };");

  console.log("\n✅ Ready to use! Connect your wallet and try buying tokens.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
