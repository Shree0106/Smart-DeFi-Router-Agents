# Smart-DeFi-Router-Agents

## Project Overview
**Smart-DeFi-Router-Agents** is an AI-powered DeFi investment router designed to optimize USDC placement across various protocols on the Arc network. It leverages **Gemini AI** to calculate optimal routing strategies based on user risk tolerance, target yield, and investment duration.

## Tech Stack
- **Frontend**: Next.js (React), Ethers.js, Web3Modal.
- **Backend**: Python (FastAPI), Web3.py, Google Generative AI (Gemini).
- **Smart Contracts**: Solidity (Hardhat framework).
- **Network**: Arc Testnet (Chain ID: 5042002).

## Key Directories & Files
- **`/contracts`**: Solidity smart contracts.
  - `SmartDeFiRouter.sol`: Main router contract managing user deposits and strategies.
  - `ARCToken.sol` & `MockUSDC.sol`: Token contracts for testing.
- **`/python_backend`**: FastAPI backend service.
  - `route_optimizer.py`: Main API entry point, handles AI route optimization and blockchain interaction.
- **`/pages` & `/Components`**: Next.js frontend application.
- **`/scripts`**: Hardhat deployment and utility scripts.
- **`/context`**: React context providers and Contract ABIs (`.json` files).
- **`hardhat.config.js`**: Hardhat configuration for Arc Testnet and Localhost.

## Development Workflow

### 1. Smart Contracts
*   **Compile**: `npx hardhat compile`
*   **Deploy (Testnet)**: `npx hardhat run scripts/deploy.js --network arc_testnet`
*   **Deploy (Local)**: `npx hardhat run scripts/deploy.js --network localhost`
*   **Test**: `npx hardhat test`

### 2. Python Backend
The backend handles the AI logic and off-chain optimization.
*   **Directory**: `cd python_backend`
*   **Install Dependencies**: `pip install -r requirements.txt`
*   **Run Server**: `uvicorn route_optimizer:app --reload`
    *   Runs on `http://localhost:8000`
    *   API Docs: `http://localhost:8000/docs`

### 3. Frontend
The Next.js application for user interaction.
*   **Install Dependencies**: `npm install` or `yarn`
*   **Run Dev Server**: `npm run dev`
    *   Runs on `http://localhost:3000`

## Environment Variables
Create a `.env` file in the project root with the following keys:
```env
# Blockchain
PRIVATE_KEY=your_wallet_private_key
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network

# AI Integration
GEMINI_API_KEY=your_gemini_api_key
```

## Architecture
1.  **User** interacts with the **Frontend** to set investment parameters (Amount, Risk, Duration).
2.  **Frontend** sends a request to the **Python Backend**.
3.  **Python Backend**:
    *   Fetches available protocols and live data from the **Smart Contract** (or fallbacks).
    *   Uses **Gemini AI** to generate an optimized allocation strategy.
    *   Returns the optimal route to the Frontend.
4.  **Frontend** prompts the user to sign a transaction to `executeRoute` on the **SmartDeFiRouter** contract.
