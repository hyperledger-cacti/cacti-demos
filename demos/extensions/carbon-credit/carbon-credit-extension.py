import requests
from web3 import Web3
from eth_utils import to_wei

PROVIDER_CONTAINER_URL = "http://polygon-fork:8545"
PROVIDER_URL = "http://localhost:8545"
USER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

wallet_object = {
    # Hardhat default account 0 for testing purposes
    "address": USER,
    "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "providerURL": PROVIDER_CONTAINER_URL,
}

def get_available_tco2s(params):
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-carbon-credit/get-available-tco2s"
    headers = {"Content-Type": "application/json"}
    resp = requests.post(url, json=params, headers=headers)
    resp.raise_for_status()
    return resp.json()

def get_token_address_by_symbol(network, symbol):
    mapping = {
        ("polygon", "USDC"): "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        ("polygon", "NCT"): "0xD838290e877E0188a4A44700463419ED96c16107",
    }
    return mapping.get((network, symbol))


def specific_buy_request(params):
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-carbon-credit/specific-buy"
    headers = {"Content-Type": "application/json"}
    resp = requests.post(url, json=params, headers=headers)
    resp.raise_for_status()
    return resp.json()


def retire_request(params):
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-carbon-credit/retire"
    headers = {"Content-Type": "application/json"}
    resp = requests.post(url, json=params, headers=headers)
    resp.raise_for_status()
    return resp.json()



if __name__ == "__main__":
    print("Requesting TCO2s ordered by supply...")
    tco2s_response = get_available_tco2s({"marketplace": "Toucan", "network": "Polygon", "orderBy": "supply"})

    tco2_list = tco2s_response.get("tco2List")
    total_count = tco2s_response.get("totalCount")

    if total_count is None:
        total_count = len(tco2_list)

    if total_count <= 0:
        raise Exception("No TCO2s returned from get-available-tco2s.")

    # Required amount: 400 NCT
    required = to_wei(400, "ether")

    selected_tco2s = []

    ERC20_ABI = [
        {
            "constant": True,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function",
        }
    ]

    # Check if each TCO2 has at least 'required' balance in NCT contract, otherwise the test will fail
    provider = Web3(Web3.HTTPProvider(PROVIDER_URL))

    nct_address = get_token_address_by_symbol("polygon", "NCT")
    if not nct_address:
        raise Exception("NCT token address for polygon not found; update get_token_address_by_symbol mapping.")
    nct_address = Web3.to_checksum_address(nct_address)

    for t in tco2_list:
        try:
            if not isinstance(t, dict):
                continue
            t_addr = t.get("address")
            if not t_addr:
                continue
            t_addr = Web3.to_checksum_address(t_addr)
            tco2_contract = provider.eth.contract(address=t_addr, abi=ERC20_ABI)
            bal = tco2_contract.functions.balanceOf(nct_address).call()
            if bal >= required:
                selected_tco2s.append(t)
                if len(selected_tco2s) >= 3:
                    break
        except Exception as err:
            print(f"Failed to query balance for {t.get('address') if isinstance(t, dict) else t}: {err}")

    if len(selected_tco2s) < 3:
        raise Exception(f"Not enough TCO2s with sufficient liquidity found. Found only {len(selected_tco2s)}")

    # We will buy 3 TCO2s, 400 units each (400 * 1e18)
    print("Selected TCO2s for specific buy test:")
    for tco2 in selected_tco2s:
        print(f"- {tco2['address']} (projectId {tco2.get('projectDetails').get('projectId')})")

    items = {
        selected_tco2s[0]["address"]: str(required),
        selected_tco2s[1]["address"]: str(required),
        selected_tco2s[2]["address"]: str(required),
    }

    payment_token_addr = get_token_address_by_symbol("polygon", "USDC")
    if not payment_token_addr:
        raise Exception("Payment token address for USDC on polygon not found; update get_token_address_by_symbol mapping.")

    specific_payload = {
        "marketplace": "Toucan",
        "network": "Polygon",
        "paymentToken": payment_token_addr,
        "items": items,
        "walletObject": wallet_object,
    }

    print("Performing specific buy...")
    specific_buy_response = specific_buy_request(specific_payload)
    if not specific_buy_response or not isinstance(specific_buy_response, dict):
        raise Exception("specificBuy response is empty or invalid.")

    if "txHashSwap" not in specific_buy_response or "buyTxHash" not in specific_buy_response or "assetAmounts" not in specific_buy_response:
        raise Exception("specificBuy response missing expected fields.")

    asset_amounts = specific_buy_response["assetAmounts"]
    if not isinstance(asset_amounts, list) or len(asset_amounts) != 3:
        raise Exception(f"Expected 3 assetAmounts, got {len(asset_amounts) if isinstance(asset_amounts, list) else 'invalid'}")

    # Verify each purchased amount is 90% of the requested amount (due to 10% fees)
    expected_amount = to_wei(360, "ether")
    for asset_amount in asset_amounts:
        if asset_amount.get("amount") != str(expected_amount):
            raise Exception(f"Unexpected asset amount: {asset_amount.get('amount')} (expected {expected_amount})")

    print("Specific buy succeeded. txHashSwap:", specific_buy_response.get("txHashSwap"), "buyTxHash:", specific_buy_response.get("buyTxHash"), "assetAmounts:", asset_amounts)

    retired_amount = to_wei(200, "ether")
    retire_items = {tco2["address"]: str(retired_amount) for tco2 in selected_tco2s[:3]}

    retire_request_payload = {
        "marketplace": "Toucan",
        "network": "Polygon",
        "entityName": "Unit Test Entity",
        "tco2s": list(retire_items.keys()),
        "amounts": list(retire_items.values()),
        "beneficiaryAddress": USER,
        "beneficiaryName": "Unit Test Beneficiary",
        "message": "Retired for specific buy test",
        "retirementReason": "Unit testing specific buy retire",
        "walletObject": wallet_object,
    }

    print("Performing retire...")
    response = retire_request(retire_request_payload)
    if not response:
        raise Exception("retire response missing data.")

    tx_hashes = response.get("txHashesRetire")
    cert_ids = response.get("retirementCertificateIds")
    if not tx_hashes or not cert_ids:
        raise Exception("retire response missing expected fields.")
    if len(tx_hashes) != len(selected_tco2s[:3]) or len(cert_ids) != len(selected_tco2s[:3]):
        raise Exception("retire response does not contain expected number of tx hashes or certificate ids.")

    for cid in cert_ids:
        print(f"Retirement certificate {cid} created.")

    print("Verifying retirement certificate amounts on-chain...")
    NFT_CONTRACT_ADDRESS = Web3.to_checksum_address("0x5e377f16e4ec6001652befd737341a28889af002")
    NFT_ABI = [
        {
            "inputs": [{"internalType": "uint256", "name": "_id", "type": "uint256"}],
            "name": "getRetiredAmount",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function",
        }
    ]

    nft_contract = provider.eth.contract(address=NFT_CONTRACT_ADDRESS, abi=NFT_ABI)

    retired_amounts = {}

    for cid in cert_ids:
        cid_int = int(cid)

        try:
            onchain_retired = nft_contract.functions.getRetiredAmount(cid_int).call()
        except Exception as err:
            raise Exception(f"Failed to query getRetiredAmount for certificate id {cid_int}: {err}")

        retired_amounts[cid_int] = int(onchain_retired)
        print(f"Certificate {cid_int} retired amount on-chain: {onchain_retired}")

        if int(onchain_retired) != retired_amount:
            raise Exception(
                f"Retired amount mismatch for certificate {cid_int}: expected {retired_amount}, got {onchain_retired}"
            )

    print("All retirement certificate amounts verified and match expected retired amounts.")
