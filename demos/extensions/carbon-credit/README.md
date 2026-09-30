# Carbon Credit Extension Demo (Toucan)

This demo exercises the gateway's `CARBON_CREDIT` extension: it buys and retires TCO2 tokens (Toucan Protocol) on a Polygon fork, paying with USDC.

The main script performs these high-level actions:

- Requests available TCO2s ordered by supply.
- Selects 3 TCO2 tokens with at least 400 units (18 decimals) of liquidity in the NCT contract.
- Performs a specific buy of 3 TCO2s (400 units each) paying with USDC and checks asset amounts (expected 360 units after fees).
- Retires 200 units of each purchased TCO2 and verifies retirement certificates on-chain via the NFT contract.

## Prerequisites

- Docker (the gateway image is x86; on Apple Silicon enable Rosetta)
- Python 3.8+ with `pip install requests web3`
- No `make` target exists for this demo — run the steps below manually.

## Setup

### 1. Start the gateway and the Polygon fork

From this directory:

```bash
docker compose up
```

This starts two services (see `docker-compose.yaml`):

1. `satp-hermes-gateway` — the gateway, mounted with [config/config.json](config/config.json). The `extensions` section must contain the `CARBON_CREDIT` entry (it does by default) with the Polygon RPC URL `http://polygon-fork:8545` and the funded test account's signing credential.
2. `polygon-fork` — a Hardhat-backed Polygon fork on `localhost:8545`.

Gateway logs are written to `./satp-hermes-gateway/logs/`.

### 2. Fund the test account with USDC

```bash
python3 fund-usdc-to-address.py
```

The script impersonates a rich USDC holder on the fork (via `hardhat_setBalance`/impersonation) and transfers USDC to the test address configured in the scripts. Expected output: logs confirming the transfer and the recipient's USDC balance.

### 3. Run the extension script

```bash
python3 carbon-credit-extension.py
```

## What you should see

Key lines from the script:

- `Requesting TCO2s ordered by supply...` and the selected TCO2 addresses/project IDs
- `Performing specific buy...` with `txHashSwap`, `buyTxHash`, and `assetAmounts`
- `Performing retire...` followed by certificate creation messages, e.g. `Retirement certificate <id> created.`
- `Verifying retirement certificate amounts on-chain...` with on-chain retired amounts and a final success message

The script raises an exception and exits non-zero if:

- No TCO2s are returned.
- Fewer than 3 TCO2s have sufficient NCT liquidity.
- The buy response lacks expected fields or amounts.
- The retire response lacks expected tx hashes or certificate IDs.
- On-chain retired amounts do not match the expected values (200 * 1e18).

## Teardown

```bash
# Ctrl+C the compose session, then:
docker compose down -v
```

## Troubleshooting

- **Script fails querying balances** — check the provider URL (the fork must be up on port 8545) and that token addresses are in checksum format.
- **Extension endpoints missing (404s)** — confirm `config/config.json` has the `CARBON_CREDIT` extension entry; the gateway only exposes the endpoints when the extension is enabled.
- **USDC transfer fails** — the fork must be running before `fund-usdc-to-address.py`; restart compose and retry.
- **Unexpected chain state on re-runs** — recreate the fork with `docker compose down -v && docker compose up`.
