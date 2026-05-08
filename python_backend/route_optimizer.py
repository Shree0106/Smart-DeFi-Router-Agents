"""
Route Optimizer Python Backend
Handles route calculation and blockchain interactions with RPC fallback support
Integrates Gemini AI for intelligent route optimization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from web3 import Web3
from web3.exceptions import ContractLogicError
import json
import asyncio
import os
from pathlib import Path
from decimal import Decimal
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env")

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"✅ Gemini API configured")
else:
    print("⚠️ WARNING: GEMINI_API_KEY not found in .env")

app = FastAPI(title="Route Optimizer API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Arc Testnet Configuration
ROUTER_ADDRESS = "0x2762ce47D9A3C74FD8B959802e367faD05c2B2a0"
TOKEN_ADDRESS = "0xDFE3A8cd9B80359f760eF4A432d0e535E6957Fd2"

# RPC URLs with fallback
RPC_URLS = [
    "https://rpc.blockdaemon.testnet.arc.network",
    "https://rpc.drpc.testnet.arc.network",
    "https://rpc.testnet.arc.network",
    "https://rpc.quicknode.testnet.arc.network",
]

# Load ABIs from JSON files
def load_abi(filename: str) -> list:
    """Load ABI from context directory"""
    try:
        # Get the parent directory (AI_Agents)
        current_dir = Path(__file__).parent.resolve()  # python_backend directory
        parent_dir = current_dir.parent  # AI_Agents directory
        abi_path = parent_dir / "context" / filename
        
        print(f"Loading ABI from: {abi_path}")
        
        if abi_path.exists():
            with open(abi_path, 'r') as f:
                data = json.load(f)
                abi = data.get('abi', [])
                print(f"✅ Loaded {len(abi)} ABI entries from {filename}")
                return abi
        else:
            print(f"⚠️ ABI file not found: {abi_path}")
            return []
    except Exception as e:
        print(f"❌ Error loading ABI from {filename}: {e}")
        return []

# Load ABIs
ROUTER_ABI = load_abi("SmartDeFiRouter.json")
ERC20_ABI = load_abi("ERC20.json")

if not ROUTER_ABI:
    print("⚠️ WARNING: Router ABI not loaded! Contract calls will fail.")
if not ERC20_ABI:
    print("⚠️ WARNING: ERC20 ABI not loaded! Token calls will fail.")


class RouteRequest(BaseModel):
    amount: float
    risk_level: int
    target_yield: float
    duration: int


class Protocol(BaseModel):
    address: str
    name: str
    risk_score: int
    current_yield: float
    total_deposited: str
    is_active: bool


class RouteResponse(BaseModel):
    protocols: List[str]
    protocol_names: List[str]
    amounts: List[str]
    yields: List[float]
    risks: List[int]
    expected_yield: float
    risk_score: float


class Web3Manager:
    """Manages Web3 connections with RPC fallback"""
    
    def __init__(self):
        self.w3 = None
        self.current_rpc_index = 0
        self._connect()
    
    def _connect(self):
        """Connect to RPC with fallback"""
        for i, rpc_url in enumerate(RPC_URLS):
            try:
                self.w3 = Web3(Web3.HTTPProvider(rpc_url))
                if self.w3.is_connected():
                    self.current_rpc_index = i
                    print(f"✅ Connected to RPC: {rpc_url}")
                    return
            except Exception as e:
                print(f"⚠️ Failed to connect to {rpc_url}: {e}")
                continue
        
        raise Exception("Failed to connect to any RPC")
    
    def get_contract(self, address: str, abi: list):
        """Get contract instance"""
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(address),
            abi=abi
        )
    
    def retry_on_failure(self, func, *args, **kwargs):
        """Retry function with RPC fallback"""
        for attempt in range(len(RPC_URLS)):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                print(f"⚠️ Attempt {attempt + 1} failed: {e}")
                if attempt < len(RPC_URLS) - 1:
                    # Try next RPC
                    self.current_rpc_index = (self.current_rpc_index + 1) % len(RPC_URLS)
                    self._connect()
                else:
                    raise e


# Initialize Web3 Manager
web3_manager = Web3Manager()


@app.get("/")
async def root():
    return {
        "service": "Route Optimizer API",
        "status": "online",
        "rpc_connected": web3_manager.w3.is_connected(),
        "current_rpc": RPC_URLS[web3_manager.current_rpc_index]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        is_connected = web3_manager.w3.is_connected()
        block_number = web3_manager.w3.eth.block_number if is_connected else None
        
        return {
            "status": "healthy" if is_connected else "degraded",
            "rpc_connected": is_connected,
            "current_rpc": RPC_URLS[web3_manager.current_rpc_index],
            "block_number": block_number
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/protocols")
async def get_protocols() -> List[Protocol]:
    """Get all available protocols from the router contract"""
    
    # Define fallback mock protocols
    fallback_protocols = [
        Protocol(
            address="0x1111111111111111111111111111111111111111",
            name="Arc Lending Protocol",
            risk_score=25,
            current_yield=8.5,
            total_deposited="0",
            is_active=True
        ),
        Protocol(
            address="0x2222222222222222222222222222222222222222",
            name="Arc Staking Pool",
            risk_score=30,
            current_yield=7.2,
            total_deposited="0",
            is_active=True
        ),
        Protocol(
            address="0x3333333333333333333333333333333333333333",
            name="Arc Liquidity Pool",
            risk_score=45,
            current_yield=9.1,
            total_deposited="0",
            is_active=True
        ),
        Protocol(
            address="0x4444444444444444444444444444444444444444",
            name="Arc Yield Vault",
            risk_score=20,
            current_yield=6.5,
            total_deposited="0",
            is_active=True
        ),
        Protocol(
            address="0x5555555555555555555555555555555555555555",
            name="Arc Strategy Pool",
            risk_score=35,
            current_yield=7.8,
            total_deposited="0",
            is_active=True
        ),
        Protocol(
            address="0x6666666666666666666666666666666666666666",
            name="Arc High Yield Farm",
            risk_score=55,
            current_yield=12.5,
            total_deposited="0",
            is_active=True
        ),
        Protocol(
            address="0x7777777777777777777777777777777777777777",
            name="Arc Leveraged Vault",
            risk_score=70,
            current_yield=15.8,
            total_deposited="0",
            is_active=True
        ),
        Protocol(
            address="0x8888888888888888888888888888888888888888",
            name="Arc Options Strategy",
            risk_score=85,
            current_yield=20.2,
            total_deposited="0",
            is_active=True
        ),
    ]
    
    try:
        # Check if ABI is loaded
        if not ROUTER_ABI:
            print("⚠️ Router ABI not loaded, using fallback protocols")
            return fallback_protocols
        
        router_contract = web3_manager.get_contract(ROUTER_ADDRESS, ROUTER_ABI)
        
        def fetch_protocols():
            return router_contract.functions.getAllProtocols().call()
        
        protocols_data = web3_manager.retry_on_failure(fetch_protocols)
        
        # Check if we got any data
        if not protocols_data:
            print("⚠️ No protocols returned from blockchain, using fallback")
            return fallback_protocols
        
        protocols = []
        for p in protocols_data:
            protocols.append(Protocol(
                address=p[0],  # protocolAddress
                name=p[1],     # name
                risk_score=p[2],  # riskScore
                current_yield=p[3] / 100,  # currentYield (convert from basis points)
                total_deposited=str(Web3.from_wei(p[4], 'ether')),  # totalDeposited
                is_active=p[5]  # isActive
            ))
        
        print(f"✅ Fetched {len(protocols)} protocols from blockchain")
        
        # Check if any protocols are active
        active_protocols = [p for p in protocols if p.is_active]
        if not active_protocols and protocols:
            print("⚠️ No active protocols on blockchain, using fallback protocols")
            return fallback_protocols
        
        return protocols if protocols else fallback_protocols
    
    except Exception as e:
        print(f"❌ Error fetching protocols from blockchain: {e}")
        print("⚠️ Returning mock protocols as fallback")
        return fallback_protocols


@app.post("/calculate-route")
async def calculate_route(request: RouteRequest) -> RouteResponse:
    """Calculate optimal route based on user parameters using Gemini AI"""
    try:
        print(f"📊 Calculating route for {request.amount} USDC")
        print(f"   Risk Level: {request.risk_level}, Target Yield: {request.target_yield}%")
        
        # Validate inputs
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be greater than 0")
        if not (0 <= request.risk_level <= 100):
            raise HTTPException(status_code=400, detail="Risk level must be between 0 and 100")
        if not (0 < request.target_yield <= 100):
            raise HTTPException(status_code=400, detail="Target yield must be between 0 and 100")
        
        # Get all protocols
        protocols = await get_protocols()
        print(f"📋 Retrieved {len(protocols)} protocols")
        
        # Debug: Print protocol details
        for p in protocols:
            print(f"   - {p.name}: Risk {p.risk_score}, Yield {p.current_yield}%, Active: {p.is_active}")
        
        if not protocols:
            raise HTTPException(status_code=404, detail="No protocols available")
        
        # Filter by risk tolerance
        suitable_protocols = [
            p for p in protocols 
            if p.is_active and p.risk_score <= request.risk_level
        ]
        
        if not suitable_protocols:
            # Find the minimum risk score available
            active_protocols = [p for p in protocols if p.is_active]
            if not active_protocols:
                raise HTTPException(
                    status_code=404, 
                    detail="No active protocols available"
                )
            
            min_risk = min(p.risk_score for p in active_protocols)
            max_risk = max(p.risk_score for p in active_protocols)
            
            # If user's risk level is too low, suggest the minimum
            if request.risk_level < min_risk:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Risk level {request.risk_level} is too low. Minimum available risk level is {min_risk}. Please increase your risk tolerance to at least {min_risk}."
                )
            
            # User's risk level should be high enough, but no exact matches
            # This shouldn't happen, but provide helpful error
            raise HTTPException(
                status_code=400, 
                detail=f"No protocols match risk level {request.risk_level}. Available risk range: {min_risk}-{max_risk}. Try adjusting your risk level."
            )
        
        # Use Gemini AI for intelligent route optimization
        if GEMINI_API_KEY:
            try:
                route = await optimize_route_with_gemini(
                    suitable_protocols,
                    request.amount,
                    request.risk_level,
                    request.target_yield,
                    request.duration
                )
                print(f"✅ Route optimized with Gemini AI")
                return route
            except Exception as gemini_error:
                print(f"⚠️ Gemini AI optimization failed: {gemini_error}")
                print(f"   Falling back to traditional optimization")
        
        # Fallback to traditional optimization
        route = traditional_route_optimization(
            suitable_protocols,
            request.amount,
            request.risk_level,
            request.target_yield,
            request.duration
        )
        
        print(f"✅ Route calculated: {len(route.protocols)} protocols")
        print(f"   Expected Yield: {route.expected_yield}%, Risk: {route.risk_score}")
        
        return route
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error calculating route: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate route: {str(e)}")


async def optimize_route_with_gemini(
    protocols: List[Protocol],
    amount: float,
    risk_level: int,
    target_yield: float,
    duration: int
) -> RouteResponse:
    """Use Gemini AI to optimize route allocation"""
    
    # Prepare protocol data for Gemini
    protocol_info = "\n".join([
        f"- {p.name}: Risk Score {p.risk_score}/100, APY {p.current_yield}%, Active: {p.is_active}"
        for p in protocols
    ])
    
    prompt = f"""
You are a DeFi portfolio optimization AI. Analyze these protocols and create an optimal investment strategy.

USER PARAMETERS:
- Investment Amount: {amount} USDC
- Risk Tolerance: {risk_level}/100 (0=very safe, 100=very risky)
- Target Yield: {target_yield}% APY minimum
- Investment Duration: {duration} days

AVAILABLE PROTOCOLS:
{protocol_info}

TASK:
Create an optimal portfolio allocation strategy that:
1. Maximizes yield while staying within the risk tolerance
2. Diversifies across 3-5 protocols for risk management
3. Prioritizes protocols with higher yields when risk allows
4. Balances risk vs reward based on user's risk tolerance

REQUIREMENTS:
- Only select protocols with risk_score <= {risk_level}
- Select between 3 to 5 protocols (or all if fewer available)
- Allocate percentages that sum to 100%
- Higher risk tolerance should favor higher yield protocols
- Lower risk tolerance should favor safer protocols with lower yields

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{{
  "selected_protocols": [
    {{
      "name": "protocol_name",
      "allocation_percent": 30.5,
      "reasoning": "brief reason for this allocation"
    }}
  ],
  "strategy_summary": "brief summary of the strategy",
  "estimated_apy": 8.5,
  "portfolio_risk": 35
}}
"""
    
    try:
        # Use Gemini Pro model
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        # Parse Gemini's response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        gemini_result = json.loads(response_text)
        
        # Map Gemini's selections back to actual protocols
        selected_protocols = []
        amounts = []
        yields = []
        risks = []
        protocol_names = []
        
        for selection in gemini_result["selected_protocols"]:
            # Find matching protocol
            matching_protocol = next(
                (p for p in protocols if p.name == selection["name"]),
                None
            )
            
            if matching_protocol:
                selected_protocols.append(matching_protocol.address)
                protocol_names.append(matching_protocol.name)
                
                # Calculate amount based on percentage
                allocated_amount = amount * (selection["allocation_percent"] / 100)
                amounts.append(f"{allocated_amount:.6f}")
                
                yields.append(matching_protocol.current_yield)
                risks.append(matching_protocol.risk_score)
        
        # Calculate weighted averages
        total_allocation = sum(float(a) for a in amounts)
        avg_yield = sum(
            yields[i] * (float(amounts[i]) / total_allocation)
            for i in range(len(yields))
        )
        avg_risk = sum(
            risks[i] * (float(amounts[i]) / total_allocation)
            for i in range(len(risks))
        )
        
        print(f"🤖 Gemini AI Strategy: {gemini_result.get('strategy_summary', 'N/A')}")
        
        return RouteResponse(
            protocols=selected_protocols,
            protocol_names=protocol_names,
            amounts=amounts,
            yields=yields,
            risks=risks,
            expected_yield=round(avg_yield, 2),
            risk_score=round(avg_risk, 2)
        )
    
    except Exception as e:
        print(f"❌ Gemini optimization error: {e}")
        raise


def traditional_route_optimization(
    protocols: List[Protocol],
    amount: float,
    risk_level: int,
    target_yield: float,
    duration: int
) -> RouteResponse:
    """Traditional route optimization (fallback method)"""
    
    # Sort by yield (highest first)
    protocols.sort(key=lambda p: p.current_yield, reverse=True)
    
    # Select top 3-5 protocols
    selected_protocols = protocols[:min(5, len(protocols))]
    
    # Distribute amount evenly
    amount_per_protocol = amount / len(selected_protocols)
    
    # Calculate averages
    avg_yield = sum(p.current_yield for p in selected_protocols) / len(selected_protocols)
    avg_risk = sum(p.risk_score for p in selected_protocols) / len(selected_protocols)
    
    return RouteResponse(
        protocols=[p.address for p in selected_protocols],
        protocol_names=[p.name for p in selected_protocols],
        amounts=[f"{amount_per_protocol:.6f}" for _ in selected_protocols],
        yields=[p.current_yield for p in selected_protocols],
        risks=[p.risk_score for p in selected_protocols],
        expected_yield=round(avg_yield, 2),
        risk_score=round(avg_risk, 2)
    )


@app.get("/allowance/{user_address}")
async def check_allowance(user_address: str) -> Dict:
    """Check user's token allowance for the router"""
    try:
        token_contract = web3_manager.get_contract(TOKEN_ADDRESS, ERC20_ABI)
        
        def fetch_allowance():
            return token_contract.functions.allowance(
                Web3.to_checksum_address(user_address),
                Web3.to_checksum_address(ROUTER_ADDRESS)
            ).call()
        
        allowance_wei = web3_manager.retry_on_failure(fetch_allowance)
        allowance_ether = Web3.from_wei(allowance_wei, 'ether')
        
        return {
            "user": user_address,
            "spender": ROUTER_ADDRESS,
            "allowance_wei": str(allowance_wei),
            "allowance_ether": str(allowance_ether),
            "has_allowance": allowance_wei > 0
        }
    
    except Exception as e:
        print(f"❌ Error checking allowance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check allowance: {str(e)}")


@app.get("/balance/{user_address}")
async def check_balance(user_address: str) -> Dict:
    """Check user's token balance"""
    try:
        token_contract = web3_manager.get_contract(TOKEN_ADDRESS, ERC20_ABI)
        
        def fetch_balance():
            return token_contract.functions.balanceOf(
                Web3.to_checksum_address(user_address)
            ).call()
        
        balance_wei = web3_manager.retry_on_failure(fetch_balance)
        balance_ether = Web3.from_wei(balance_wei, 'ether')
        
        return {
            "user": user_address,
            "token": TOKEN_ADDRESS,
            "balance_wei": str(balance_wei),
            "balance_ether": str(balance_ether)
        }
    
    except Exception as e:
        print(f"❌ Error checking balance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to check balance: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)