# EVM Project

This directory contains the Hardhat project for deploying and testing smart contracts used in the SATP Gateway Demo.

## Prerequisites

- Node.js 18.19.0 (recommended to use `nvm`)
- npm

## Install Dependencies

Run the following command in this directory to install all required packages:

```bash
npm install
```

## Compile all Contracts

Run the following command in this directory to compile all Solidity smart contracts under `/contracts`:

```bash
npx hardhat compile
```

## Running Hardhat Node

To start a local Hardhat node (a test ledger):

```bash
npx hardhat node --hostname 0.0.0.0 --port 8545
# or for a second node (on a different port):
npx hardhat node --hostname 0.0.0.0 --port 8546
```

## Running Tests

To run the test suite:

```bash
npx hardhat test
```

## Running Scripts

You can run scripts located in the `scripts/` directory. For example, to deploy the SATPTokenContract:

```bash
node scripts/SATPTokenContract.js
```

Refer to each script for specific usage and configuration details.

## Network Configuration

The `hardhat.config.js` file defines two networks:
- `hardhat1`: http://0.0.0.0:8545
- `hardhat2`: http://0.0.0.0:8546

These are used for deploying two separate EVM blockchains in the SATP Gateway Demo.
