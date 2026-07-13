from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

# connect to your local Hardhat fork
provider = Web3(Web3.HTTPProvider("http://localhost:8545"))
provider.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
assert provider.is_connected(), "Hardhat fork not running!"

# USDC token address on Polygon mainnet
USDC_ADDRESS = provider.to_checksum_address("0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359")
# your test address that needs USDC
RECIPIENT = provider.to_checksum_address("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
# a real USDC holder address (you can find on polygonscan)
WHALE = provider.to_checksum_address("0xD36ec33c8bed5a9F7B6630855f1533455b98a418")

ERC20_ABI = [
    {"constant": False, "inputs": [
        {"name": "_to", "type": "address"},
        {"name": "_value", "type": "uint256"},
    ], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf",
     "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"},
]

usdc = provider.eth.contract(address=USDC_ADDRESS, abi=ERC20_ABI)

print("🔍 Checking recipient balance...")
initial_balance = usdc.functions.balanceOf(RECIPIENT).call()
print(f"💰 Initial RECIPIENT ({RECIPIENT}) USDC Balance:", initial_balance / 10**6)

# Impersonate whale
provider.provider.make_request("hardhat_impersonateAccount", [WHALE])

# Give whale some MATIC for gas
one_matic_hex = hex(Web3.to_wei(1, "ether"))
provider.provider.make_request("hardhat_setBalance", [WHALE, one_matic_hex])

provider.eth.default_account = WHALE

# Transfer 1,000,000 USDC (decimals = 6)
amount = 1_000_000 * 10**6
tx = usdc.functions.transfer(RECIPIENT, amount).build_transaction({
    "from": WHALE,
    "gas": 200000,
    "gasPrice": Web3.to_wei("30", "gwei"),
    "nonce": provider.eth.get_transaction_count(WHALE),
})

# Send transaction (i.e., whale to recipient transfer USDC)
tx_hash = provider.eth.send_transaction(tx)
receipt = provider.eth.wait_for_transaction_receipt(tx_hash)
print("✅ Tx Hash (USDC transfer):", receipt.transactionHash.hex())

# Verify balance of recipient
print("🔍 Verifying recipient balance...")
balance = usdc.functions.balanceOf(RECIPIENT).call()
print(f"💰 Recipient ({RECIPIENT}) USDC Balance:", balance / 10**6)

# Stop impersonation
provider.provider.make_request("hardhat_stopImpersonatingAccount", [WHALE])
