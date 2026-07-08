# Carbon Credit Extension (Toucan) — run carbon-credit-extension.py

This file shows how to run the carbon-credit-extension.py test flow that buys and retires TCO2s using the Gateway. Before running the main script you must fund the test account with USDC using Hardhat impersonation.

The main script performs these high-level actions:
- Requests available TCO2s ordered by supply.
- Selects 3 TCO2 tokens with at least 400 units (18 decimals) of liquidity in the NCT contract.
- Performs a specific buy of 3 TCO2s (400 units each) paying with USDC and checks asset amounts (expected 360 units after fees).
- Retires 200 units of each purchased TCO2 and verifies retirement certificates on-chain via the NFT contract.

---

## Flow Summary

1. Start the Gateway and Polygon fork (if applicable) using Docker compose.
2. Ensure the Gateway config (config/config.json) has the CARBON_CREDIT extension enabled
3. Use fund-usdc-to-address.py to impersonate and fund the testing account with USDC.
4. Run carbon-credit-extension.py — it will:
    - call get-available-tco2s,
    - choose three qualifying TCO2s,
    - call specific_buy_request,
    - call retire_request,
    - verify on-chain retirement certificate amounts.
5. Inspect printed output and any Gateway / node logs for transaction hashes and verification messages.

---

## Setup Instructions

### 1. Start the Gateway (Docker) — if applicable

If your test requires the local Gateway, from this directory:

```bash
docker compose up
```

This will start 2 different services.

1. The Gateway using your environment config. There are **2 important files/directories**:
- [config/config.json](config/config.json) — contains the configuration used to start the Gateway, including RPC URLs, and key pairs.
  - The extensions section must include the CARBON_CREDIT extension, for the endpoints to be available.
- [satp-hermes-gateway/logs/](satp-hermes-gateway/logs/) — contains Gateway logs, useful for debugging requests/responses.

2. A Polygon fork using Hardhat (if you used the provided docker-compose.yaml). This is optional if you have your own Hardhat node running.

---

### 2. Fund the testing account with USDC (impersonation)

Before running the carbon-credit script you must fund the USER/test address with USDC on the fork. Use the provided script:

```bash
python3 fund-usdc-to-address.py
```

**Expected Result**:
- The script impersonates a rich USDC holder (via Hardhat) and transfers sufficient USDC to the test address.
- You should see logs confirming the USDC transfer and the recipient address balance.

---

### 3. Run the carbon credit extension script

From this directory, run:

```bash
python3 carbon-credit-extension.py
```

**Expected Result**:

What to expect (key printed lines from the script):
- "Requesting TCO2s ordered by supply..."
- Logs showing selected TCO2 addresses and projectId values.
- "Performing specific buy..." and details including txHashSwap, buyTxHash, assetAmounts.
- "Performing retire..." followed by certificate creation messages, e.g. "Retirement certificate <id> created."
- "Verifying retirement certificate amounts on-chain..." with on-chain retired amounts and a final success message.

The script will raise exceptions and exit if:
- No TCO2s are returned.
- Fewer than 3 TCO2s have sufficient NCT liquidity.
- specificBuy response lacks expected fields or amounts.
- retire response lacks expected tx hashes or certificate ids.
- On-chain retired amounts do not match expected values (200 * 1e18).

---

## Troubleshooting & Logs

- Check Hardhat terminal for impersonation and transaction logs.
- If the script fails when querying balances, ensure the provider URL is correct and the token addresses are in checksum format.
- Gateway logs (if used) are in `./satp-hermes-gateway/logs/` relative to this directory for request/response details.
