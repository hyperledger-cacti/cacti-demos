# Case 3: SATP Fungible Asset Transfers Across Three EVM Blockchains

This test case demonstrates how the Gateway can run the Secure Asset Transfer Protocol (SATP) between 6 different pairs of EVM-based blockchains. The idea is to use the Gateway as a middleware to burn the original fungible asset in the source blockchain and mint a representation on the destination blockchain three times, with the exact same pair of Gateways, but between different EVM-based blockchains.

For this, we will use the `SATPTokenContract` contract, which is a simple contract that resembles a token contract following the ERC20 standard.

## Terminal Overview

Before starting, here is a summary of what each terminal will be used for in this case:

- **Terminal 1:** Run the Gateway (Docker Compose)
- **Terminal 2:** Start Hardhat EVM Blockchain 1 (port 8545)
- **Terminal 3:** Start Hardhat EVM Blockchain 2 (port 8546)
- **Terminal 4:** Start Hardhat EVM Blockchain 3 (port 8547)
- **Terminal 5:** Deploy the SATPFungibleTokenContract to all blockchains
- **Terminal 6:** Run SATP protocol scripts (integration checks, transactions, status, audit)

This pattern is similar in other SATP and Oracle cases:

- **Gateway terminals** (usually Terminal 1): Always run the Gateway via Docker Compose
- **EVM/Hardhat terminals** (usually Terminals 2, 3 and 4, in this case): Start one or more local blockchains
- **Deployment/Script terminals** (Terminals 5+): Deploy contracts and run interaction scripts

Refer to each case's README for the exact mapping and steps.

## Setup Instructions

### 1. Start the Hardhat EVM Blockchains

In terminal 2, from this directory (`demos/satp/case_3`):

```bash
cd ../../../utils/test-ledgers && yarn hardhat node --hostname 0.0.0.0 --port 8545
```

In terminal 3, from this directory (`demos/satp/case_3`):

```bash
cd ../../../utils/test-ledgers && yarn hardhat node --hostname 0.0.0.0 --port 8546
```

In terminal 4, from this directory (`demos/satp/case_3`):

```bash
cd ../../../utils/test-ledgers && yarn hardhat node --hostname 0.0.0.0 --port 8547
```

> ⚠️ Make sure to use `--hostname 0.0.0.0` on all chains so that the Gateway (inside Docker) can access the local Hardhat nodes.

### 2. Start the Gateway (Docker)

In terminal 1, from this directory:

```bash
docker compose up
```

This will start both gateways with the corresponding configuration files located in `./config/gateway-1-config.json` and `./config/gateway-2-config.json`. Gateway 1 listens on ports 3010/3011/4010 and gateway 2 on 3110/3111/4110 (see `docker-compose.yaml`).

**Expected Result**: In Terminal 2, 3 and 4 (blockchains), observe a contract being deployed. This is the bridge contract `SATPWrapper` that allows the Gateway to interact with the client contracts deployed in EVM-based blockchains.
Only Gateway 1 will deploy these contracts. Gateway 2 should use the contract deployed by its counterparty.

### 2.5 (Optional) Check the blockchains to which each Gateway is connected

In terminal 5, from this directory:

```bash
python3 satp-evm-get-integrations.py
```

> This script sends a GET request to the Gateway to retrieve the list of integrations (in this case blockchains) to which each Gateway is connected. It will return the list of blockchains and a simplified description.

**Expected Result**: The output should show all EVM blockchains (Hardhat1, Hardhat2 and Hardhat3).

---

### 3. Deploy the Token Smart Contracts

In terminal 5, from this directory (`demos/satp/case_3`):

```bash
cd ../../../utils/test-ledgers && node scripts/SATPTokenContractCase3.js 1
```

> This deploys the `SATPTokenContract` to the running Hardhat networks (`hardhat1`, `hardhat2` and `hardhat3` which should be configured in `hardhat.config.js` to point to `http://0.0.0.0:8545`, `http://0.0.0.0:8546` and `http://0.0.0.0:8547` respectively). Additionally, it will perform the necessary contract calls necessary to set up the SATP protocol. Check the file to see the details of the operations performed.
> It requires a command line integer input 1, 2 or 3, depending on which transaction is to be executed out of the three (chain1 -> chain2, chain2 -> chain3, chain3 -> chain1).

---

### 4. Run the SATP Transfer Script

In terminal 6, from this directory:

```bash
python3 satp-transact.py 1
```

> This script sends POST requests to the Gateway to trigger the SATP protocol. If successful, it will burn the original asset in the source blockchain (blockchain1) and mint a representation on the destination blockchain (blockchain2). Store the `SESSION_ID` returned by the script, as it will be used in the next steps.
> Once again a command line input is required, stating which of the three transactions is to be executed.

---

### 5. Check Task Status

In Terminal 6:

```bash
python3 satp-evm-check-status.py <SESSION_ID>
```

**Expected Output**:

- Status: `DONE`
- Current Step: `transfer-complete-message` (the last step of the SATP)

---

### 6. Update Token Interaction Authorizations

Re-authorize the contracts for the next chain pair before the second transfer. In terminal 5, from this directory (`demos/satp/case_3`):

```bash
cd ../../../utils/test-ledgers && node scripts/SATPTokenContractCase3.js 2
```

> Same script as step 3, but with argument `2` to authorize the chain2 -> chain3 transfer.

---

### 7. Run the Transfer Script a Second Time

In terminal 6, from this directory:

```bash
python3 satp-transact.py 2
```

> This script sends POST requests to the Gateway to trigger the SATP protocol. If successful, it will burn the original asset in the source blockchain (blockchain 2) and mint a representation on the destination blockchain (blockchain3). Store the `SESSION_ID` returned by the script, as it will be used in the next steps.
> The command line input is again required.

---

### 8. Check Task Status

In Terminal 6:

```bash
python3 satp-evm-check-status.py <SESSION_ID>
```

**Expected Output**:

- Status: `DONE`
- Current Step: `transfer-complete-message` (the last step of the SATP)

---

### 9. Authorize and Run the Third Transfer

Authorize the final chain pair and run the last transfer. In terminal 5, from this directory (`demos/satp/case_3`):

```bash
cd ../../../utils/test-ledgers && node scripts/SATPTokenContractCase3.js 3
```

Then in terminal 6, from this directory:

```bash
python3 satp-transact.py 3
```

> This script sends POST requests to the Gateway to trigger the SATP protocol. If successful, it will burn the original asset in the source blockchain (blockchain3) and mint a representation on the destination blockchain (blockchain1). Store the `SESSION_ID` returned by the script, as it will be used in the next steps.

---

### 10. Check Task Status

In Terminal 6:

```bash
python3 satp-evm-check-status.py <SESSION_ID>
```

**Expected Output**:

- Status: `DONE`
- Current Step: `transfer-complete-message` (the last step of the SATP)

> This shows that the same Gateway pair can orchestrate SAT sessions between different blockchain pairs, as long as they are connected to the relevant blockchains for the transaction.

---

### 11. (Optional) Perform Audit and Check Operations/Proofs

In Terminal 6:

```bash
python3 satp-evm-perform-audit.py
```

> This script sends a GET request to the Gateway to retrieve detailed information about all SATP sessions in which the gateway is involved. It will return the session details, including the transactions hashes and other details of the operations performed.

Check the `/audit` directory to see the audit information.

**Expected Output**: The output should show the session details, including all the messages exchanged in the SATP protocol, transaction hashes, signatures and other details of the operations performed.

## Teardown

```bash
# Stop the gateways (terminal 1)
docker compose down

# Stop the Hardhat nodes (terminals 2, 3, and 4): Ctrl+C in each

# Or from the repository root — stops compose stacks, removes gateway containers, frees ports 8545-8547:
make clean
```

Always tear down before switching cases; stale chain state and contract addresses break the next run.

One-command alternative: `make run-satp-case-3` from the repository root performs the full three-transfer flow, including the re-authorization steps and status/audit calls (requires `npm install` inside `utils/test-ledgers` so that the Makefile's `npx hardhat` resolves).

## Troubleshooting

- **Ports already in use** — gateway 1 uses 3010/3011/4010, gateway 2 uses 3110/3111/4110, chains use 8545/8546/8547. `make clean` frees them.
- **`satp-transact.py` fails immediately** — confirm both gateways are healthy: `curl http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/healthcheck` (and port 4110 for gateway 2).
- **Transfer 2 or 3 fails with permission errors** — you skipped the re-authorization step (`SATPTokenContractCase3.js 2` / `3`) or ran it with the wrong argument.
- **Stale contract addresses** — re-run the setup steps from a clean state (`make clean` first).
- **Image fails to pull on Apple Silicon** — the gateway images are `linux/amd64`; enable Rosetta in Docker Desktop.
