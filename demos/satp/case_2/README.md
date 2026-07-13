# Case 2: Using the Gateway as Middleware for READ_AND_WRITE in EVM-based blockchains

This test case demonstrates how the Gateway can run the Secure Asset Transfer Protocol (SATP) between 2 EVM-based blockchains. The idea is to use the Gateway as a middleware to burn the original non fungible asset in the source blockchain and mint a representation on the destination blockchain.

For this, we will use the `SATPNonFungibleTokenContract` contract, which is a simple contract that resembles a token contract following the ERC721 standard.

## Terminal Overview

Before starting, here is a summary of what each terminal will be used for in this case:

- **Terminal 1:** Run the Gateway (Docker Compose)
- **Terminal 2:** Start Hardhat EVM Blockchain 1 (port 8545)
- **Terminal 3:** Start Hardhat EVM Blockchain 2 (port 8546)
- **Terminal 4:** Deploy the SATPNonFungibleTokenContract to both blockchains
- **Terminal 5:** Run SATP protocol scripts (integration checks, transactions, status, audit)

This pattern is similar in other SATP and Oracle cases:

- **Gateway terminals** (usually Terminal 1): Always run the Gateway via Docker Compose
- **EVM/Hardhat terminals** (usually Terminals 2, 3): Start one or more local blockchains
- **Deployment/Script terminals** (Terminals 4+): Deploy contracts and run interaction scripts

Refer to each case's README for the exact mapping and steps.

## Setup Instructions

### 1. Start the Hardhat EVM Blockchains

In terminal 2, from this directory (`gateway/satp/case_2`):

```bash
cd ../../../utils/test-ledgers && npx hardhat node --hostname 0.0.0.0 --port 8545
```

In terminal 3, from this directory (`gateway/satp/case_2`):

```bash
cd ../../../utils/test-ledgers && npx hardhat node --hostname 0.0.0.0 --port 8546
```

> ⚠️ Make sure to use `--hostname 0.0.0.0` on both cases so that the Gateway (inside Docker) can access the local Hardhat node.

### 2. Start the Gateway (Docker)

In terminal 1, from this directory:

```bash
docker compose up
```

This will start both gateways with the corresponding configuration file located in `./config/gateway-1-config.json` and `./config/gateway-2-config.json`.

**Expected Result**: In Terminal 2 and 3 (both lockchains), observe a contract being deployed. This is the bridge contract `SATPWrapper` that allows the Gateway to interact with the client contracts deployed in EVM-based blockchains.

### 2.5 (Optional) Check the blockchains to which each Gateway is connected

In terminal 5, from this directory:

```bash
python3 satp-evm-get-integrations.py
```

> This script sends a GET request to the Gateway to retrieve the list of integrations (in this case blockchains) to which each Gateway is connected. It will return the list of blockchains and a simplified description.

**Expected Result**: The output should show the two EVM blockchains (Hardhat1 and Hardhat2).

### 3. Deploy the Token Smart Contracts

In terminal 4, from this directory (`gateway/satp/case_2`):

```bash
cd ../../../utils/test-ledgers && node scripts/SATPNonFungibleTokenContract.js
```

> This deploys the `SATPNonFungibleTokenContract` to the running Hardhat networks (`hardhat1` and `hardhat2` should be configured in `hardhat.config.js` to point to `http://0.0.0.0:8545` and `http://0.0.0.0:8546` respectively). Additionally, it will perform the necessary contract calls necessary to set up the SATP protocol. Check the file to see the details of the operations performed.

### 4. Run the Oracle Interaction Script

In terminal 5, from this directory:

```bash
python3 satp-transact.py
```

> This script sends POST requests to the Gateway to trigger the SAT protocol. If successful, it will burn the original asset in the source blockchain and mint a representation on the destination blockchain. Store the `SESSION_ID` returned by the script, as it will be used in the next steps.

---

### 5. Check Task Status

In Terminal 5:

```bash
python3 satp-evm-check-status.py <SESSION_ID>
```

**Expected Output**:

- Status: `DONE`
- Current Step: `transfer-complete-message` (the last step of the SATP)

---

### 6. Perform Audit and Check Operations/Proofs

In Terminal 5:

```bash
python3 satp-evm-perform-audit.py
```

> This script sends a GET request to the Gateway to retrieve detailed information about all SATP sessions in which the gateway is involved. It will return the session details, including the transactions hashes and other details of the operations performed.

Check the `/audit` directory to see the audit information.

**Expected Output**: The output should show the session details, including all the messages exchanged in the SATP protocol, transaction hashes, signatures and other details of the operations performed.
