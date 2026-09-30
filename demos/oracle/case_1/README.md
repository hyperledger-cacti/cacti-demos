# Case 1: Gateway as Middleware for READ and WRITE on an EVM Blockchain

This demo uses the gateway as a middleware layer to perform READ and WRITE operations on a local EVM blockchain (Hardhat), through the gateway's `/oracle/execute` endpoint.

The demo uses the `OracleTestContract` contract with two functions:

- **`setData(string memory data)`** – stores data on-chain, associated with a `bytes32` ID
- **`getData(bytes32 id)`** – retrieves data by ID

## Prerequisites

Complete the [root README installation](../../../README.md#quickstart-oracle-case-1) first: Node 20+, corepack/Yarn 4, Docker, Python 3.8+ with `requests` and `web3`. Contracts must be compiled (`yarn hardhat compile` in `utils/test-ledgers`).

## Terminals

- **Terminal 1:** gateway (Docker Compose)
- **Terminal 2:** Hardhat chain (port 8545)
- **Terminal 3:** contract deployment + demo script

The terminal layout is the same in the other oracle and SATP cases: gateway in terminal 1, one or more chains next, then deployment/script terminals.

## Setup

### 1. Start the gateway

Terminal 1, from this directory:

```bash
docker compose up
```

This mounts `./config/config.json` into the gateway container.

### 2. Start the chain

Terminal 2, from this directory:

```bash
cd ../../../utils/test-ledgers && yarn hardhat node --hostname 0.0.0.0 --port 8545
```

`--hostname 0.0.0.0` is required: the gateway runs in Docker and must be able to reach your local chain.

### 3. Deploy the contract

Terminal 3, from this directory:

```bash
cd ../../../utils/test-ledgers && yarn hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1
```

### 4. Run the demo script

Terminal 3, back in this directory:

```bash
cd ../../demos/oracle/case_1  # only if you are still in utils/test-ledgers
python3 oracle-execute-manual-read-and-write.py
```

The script sends POST requests to the gateway, which invokes `setData` and `getData` on the contract via `/oracle/execute`.

One-command alternative: `make run-oracle-case-1` from the repository root performs all of the above (requires `npm install` inside `utils/test-ledgers` so that the Makefile's `npx hardhat` resolves).

## What you should see

- Terminal 3: the gateway's write confirmation, then the read result, ending with:

```text
COMPLETE
```

- Terminal 2: the write transaction and read call in the Hardhat logs
- Gateway logs in `./satp-hermes-gateway/logs/` (relative to this directory) with full request/response details

## Teardown

```bash
# In terminal 1: Ctrl+C, then
docker compose down
# Or from the repository root (also frees ports 8545-8547):
make clean
```

Run teardown before switching to another case — stale chain state and contract addresses break the next run.

## Troubleshooting

- **Port 8545/3010/4010 already in use** — `make clean`, or `lsof -ti:PORT | xargs kill -9`.
- **Gateway can't connect to the chain** — make sure the chain was started with `--hostname 0.0.0.0`.
- **`npx hardhat` fails or downloads Hardhat** — use `yarn hardhat` (see [utils/test-ledgers/README.md](../../../utils/test-ledgers/README.md)).
- **Image fails to pull on Apple Silicon** — the gateway image is `linux/amd64`; enable Rosetta in Docker Desktop.
