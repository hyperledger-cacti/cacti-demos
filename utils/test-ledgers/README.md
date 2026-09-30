# EVM Test Ledgers (Hardhat project)

This directory contains the Hardhat project that provides the local EVM blockchains and test contracts used by the oracle and SATP demos.

- `contracts/` — `OracleTestContract`, `SATPTokenContract` (ERC20-style), `SATPNonFungibleTokenContract` (ERC721-style)
- `ignition/modules/` — Hardhat Ignition deployment modules (e.g. `OracleTestContract.js`)
- `scripts/` — deployment and interaction scripts used by the demos, e.g.:
  - `SATPTokenContract.js` — deploy + set up SATP case 1
  - `SATPNonFungibleTokenContract.js` — deploy + set up SATP case 2
  - `SATPTokenContractCase3.js <1|2|3>` — deploy/set up SATP case 3 (argument selects which chain pair to authorize)
  - `SATPTokenContract-CheckBalances.js`, `SATPTokenContract-CheckBalances-Case3.js` — check user and bridge contract balances
- `hardhat.config.js` — defines three networks:

| Network    | URL                   | Used by                   |
| ---------- | --------------------- | ------------------------- |
| `hardhat1` | `http://0.0.0.0:8545` | all cases (chain 1)       |
| `hardhat2` | `http://0.0.0.0:8546` | two-chain cases (chain 2) |
| `hardhat3` | `http://0.0.0.0:8547` | SATP case 3 (chain 3)     |

## Install

This directory is part of the root Yarn workspace. Installing from the repository root is enough:

```bash
# from the repository root
corepack enable
yarn install
```

Use `yarn hardhat ...` to invoke Hardhat (the root install does not create a `node_modules/.bin` entry here, so plain `npx hardhat` would download an unpinned Hardhat instead of using the local one). Alternatively, run `npm install` in this directory to get an npm-managed setup where `npx hardhat` works — the `Makefile` at the repository root assumes this.

## Compile the contracts

Required once before running any demo:

```bash
yarn hardhat compile
```

## Start a local chain

One terminal per chain:

```bash
yarn hardhat node --hostname 0.0.0.0 --port 8545
# second chain (two-chain cases):
yarn hardhat node --hostname 0.0.0.0 --port 8546
# third chain (SATP case 3):
yarn hardhat node --hostname 0.0.0.0 --port 8547
```

`--hostname 0.0.0.0` is required so the gateway container can reach the chain.

## Deploy a contract

```bash
yarn hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1
```

## Run tests

```bash
yarn hardhat test
```

## Teardown

Kill the node processes when done (`lsof -ti:8545 | xargs -r kill -9`), or run `make clean` from the repository root.
