# SATP Gateway Demo

This repository contains a demo implementation of a **SATP (Secure Asset Transfer Protocol) Gateway**, designed to act as middleware between EVM-based blockchains. It supports various interoperability use cases explained below.

## Table of Contents
- [SATP Gateway Demo](#satp-gateway-demo)
  - [Table of Contents](#table-of-contents)
  - [Repository Structure](#repository-structure)
  - [Case Descriptions](#case-descriptions)
    - [Extensions Cases](#extensions-cases)
    - [Oracle Cases (demos/oracle)](#oracle-cases-gatewayoracle)
    - [SATP Cases (demos/satp/)](#satp-cases-gatewaysatp)
    - [Adapter Cases (demos/adapter/)](#adapter-cases-gatewayadapter)
  - [EVM Test Environment](#evm-test-environment)
  - [Important Instructions](#important-instructions)
  - [Setup \& Running](#setup--running)
    - [Running Cases with the Makefile](#running-cases-with-the-makefile)
  - [Dependencies](#dependencies)
  - [Contact](#contact)

## Repository Structure

```
.
├── utils/
│   ├── test-ledgers/                 # Hardhat project for setting up test EVM blockchains
│   └── contracts/
│       └── fabric-contracts/         # Hyperledger Fabric chaincode for testing
├── demos/
│   ├── oracle/
│   │   ├── case_1/                   # Middleware: Manual READ and WRITE
│   │   ├── case_2/                   # Middleware: Auto READ and WRITE
│   │   ├── case_3/                   # Register polling for periodic READ
│   │   ├── case_4/                   # Event listening for READ and UPDATE
│   │   ├── case_5/                   # Middleware: Manual READ and WRITE (w/ Hyperledger Fabric)
│   │   ├── case_6/                   # Register polling for periodic READ and WRITE (w/ Hyperledger Fabric)
│   │   └── case_7/                   # Event listening for READ and WRITE (w/ Hyperledger Fabric)
│   ├── satp/
│   │   ├── case_1/                   # SATP Protocol: Fungible asset transfer between EVM blockchains
│   │   ├── case_2/                   # SATP Protocol: Non fungible asset transfer between EVM blockchains
│   │   └── case_3/                   # SATP Protocol: Fungible asset transfer between 3 different EVM blockchain pairs
│   ├── adapter/
│   │   ├── case_1/                   # Adapter Layer: Docker-based adapter webhook testing with deployed bridge
│   │   └── config/                   # Adapter configuration files (gateway + adapter YAML configs)
│   └── extensions/
│       └── carbon-credit/            # Extending core gateway logic with business-related functionality
├── examples/                         # Future: full-fledged example applications (empty for now)
├── packages/                         # Future: test packages migrated from cacti (empty for now)
├── Makefile                          # Orchestrates all demo cases
└── README.md
```

---

## Case Descriptions

### Extensions Cases

These use cases demonstrate the usage of the extensions available in the gateway:
* **Carbon Credit Extension**: Demonstrates purchasing and retiring carbon credits using the Carbon Credit extension integrated into the gateway. The extension interacts with carbon credit marketplaces on EVM blockchains. At this point, the only maketplace supported is **Toucan Protocol**.

### Oracle Cases (demos/oracle)

These use cases demonstrate the usage of the gateway as middleware to interact with EVM blockchains:

* **Case 1**: Manual **READ and WRITE** operations using the gateway
* **Case 2**: Automatic **READ and WRITE** operations using the gateway
* **Case 3**: Registering a **polling task** to periodically READ from an EVM blockchain
* **Case 4**: **Cross-chain event listening** with subsequent READ and conditional UPDATE actions

### SATP Cases (demos/satp/)

The SATP folder contains secure asset transfer protocol cases.

* **Case 1**: Coordinated **READ and WRITE** using the gateway across blockchains, following SATP protocol.
* **Case 2**: Coordinated **READ and WRITE** using the gateway across blockchains, following SATP protocol.
* **Case 3**: Coordinated **READ and WRITE** using the gateway across blockchains, following SATP protocol, between 3 blockchain pairs, and always using the same assets, starting in blockchain1.

### Adapter Cases (demos/adapter/)

These use cases demonstrate the **Adapter Layer** of the SATP Hermes Gateway, which enables external systems to integrate with and control SATP transfers through webhook-based communication.

* **Case 1**: Docker-based adapter layer testing with **deployed bridge contracts** on Besu networks, configuring outbound/inbound webhook adapters for Stage 0 new session requests.

---

## EVM Test Environment

The `utils/test-ledgers/` directory contains a **Hardhat** project used to deploy and simulate blockchain networks and contracts for the various gateway and SATP test cases.

* Located under `utils/test-ledgers/ignition/modules`, you will find simple deployment scripts and interaction modules with **hardcoded addresses** for clarity and reproducibility during testing.

---

## Important Instructions

* **Please follow the setup instructions for each case carefully.**
* **Before switching from one case to another**, **always rerun all setup commands** to ensure:

  * The environment is **fully refreshed**
  * **Contract addresses remain consistent**
  * No residual data or processes from other cases affect the results

Failure to reset the environment between cases may lead to unexpected behavior due to mismatched or stale blockchain state/configurations.

---


## Setup & Running

### Running Cases with the Makefile

You can use the provided `Makefile` to automate setup and environment preparation for the demo. Run:

```bash
make help
```

to see all available targets for building, deploying, and running the demo cases. The main targets are:

- `make run-oracle-case-1` — Oracle Case 1: Manual READ and WRITE
- `make run-oracle-case-2` — Oracle Case 2: Automatic READ and WRITE
- `make run-oracle-case-3` — Oracle Case 3: Register polling for periodic READ
- `make run-oracle-case-4` — Oracle Case 4: Event listening + READ and UPDATE
- `make run-satp-case-1`   — SATP Case 1: Fungible asset transfer protocol
- `make run-satp-case-2`   — SATP Case 2: Non fungible asset transfer protocol
- `make run-satp-case-3`   — SATP Case 3: Fungible asset transfer protocol between 3 different blockchain pairs
- `make run-adapter-case-1` — Adapter Case 1: Docker adapter layer testing with deployed bridge
- `make run-all-cases`      — Run all cases sequentially with cleanup between each

Each case also includes its own `README.md` with step-by-step instructions for manual or advanced usage.

The Hyperledger Fabric cases (demos/oracle/case_5, case_6, case_7) require additional setup steps as described in their respective READMEs, and therefore cannot be fully automated via the Makefile.

**Note:** `.PHONY` targets are now placed immediately after each script in the Makefile for clarity and maintainability.

---

## Dependencies

* [Docker & Docker Compose](https://docs.docker.com/compose/)
* [Hardhat](https://hardhat.org/)
* Python ≥ 3.8

---

## Contact

For questions or collaboration inquiries, feel free to reach out or open an issue on this repository.
