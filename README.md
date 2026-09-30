[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/hyperledger-cacti/cacti-demos/badge)](https://scorecard.dev/viewer/?uri=github.com/hyperledger-cacti/cacti-demos)
[![GitHub issues](https://img.shields.io/github/issues/hyperledger-cacti/cacti-demos)](https://github.com/hyperledger-cacti/cacti-demos/issues)
[![Open in Visual Studio Code](https://img.shields.io/static/v1?logo=visualstudiocode&label=&message=Open%20in%20Visual%20Studio%20Code&labelColor=2c2c32&color=007acc&logoColor=007acc)](https://vscode.dev/github/hyperledger-cacti/cacti-demos)

![Cacti Logo Color](./images/HL_Cacti_Logo_Color.png#gh-light-mode-only)
![Cacti Logo Color](./images/HL_Cacti_Logo_Colorreverse.svg#gh-dark-mode-only)

<!-- --8<-- [start:content] -->

# Hyperledger Cacti Demos

Hands-on demos for the Hyperledger Cacti ecosystem and the SATP Hermes gateway: gateway-as-oracle middleware, SATP cross-chain asset transfers, an adapter (webhook) layer, and a carbon-credit extension. The `examples/` and `packages/` directories hold applications and test packages migrated from the main [cacti](https://github.com/hyperledger-cacti/cacti) repository. This README gets you from clone to a running demo in a few minutes; details live in each demo's README and on the [documentation site](https://hyperledger-cacti.github.io/cacti-demos).

## Quickstart: Oracle Case 1

Oracle Case 1 runs a gateway (Docker) that reads and writes to a smart contract on a local Hardhat chain.

Prerequisites:

- Node.js 20+ (verified on 20.20.2; CI uses 22; the Makefile's `install-node` target still pins 18.19.0)
- [Corepack](https://nodejs.org/api/corepack.html) (ships with Node; provides Yarn 4.13)
- Docker with Compose v2 — gateway images are `linux/amd64`; on Apple Silicon enable Rosetta in Docker Desktop
- Python 3.8+ with `pip install requests web3`
- GNU Make
- Fabric binaries via [fabric-samples](https://github.com/hyperledger/fabric-samples) — only for oracle cases 5-7

Steps:

```bash
# 1. Clone and install (first install takes a few minutes)
git clone https://github.com/hyperledger-cacti/cacti-demos.git
cd cacti-demos
corepack enable
yarn install
yarn build:dev:backend

# 2. Compile the test contracts (required once)
cd utils/test-ledgers
yarn hardhat compile
cd ../..
```

Then, in separate terminals:

```bash
# Terminal 1 — start the gateway (from demos/oracle/case_1)
cd demos/oracle/case_1 && docker compose up

# Terminal 2 — start the local chain (from utils/test-ledgers)
cd utils/test-ledgers && yarn hardhat node --hostname 0.0.0.0 --port 8545

# Terminal 3 — deploy the contract, then run the demo
cd utils/test-ledgers && yarn hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1
cd demos/oracle/case_1 && python3 oracle-execute-manual-read-and-write.py
```

You should see `COMPLETE` in Terminal 3 and the write/read transactions in Terminal 2. Full walkthrough: [demos/oracle/case_1/README.md](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_1/README.md).

Prefer one command? `make run-oracle-case-1` automates all of the above. Note the Makefile invokes `npx hardhat`, which needs a local binary: run `npm install` inside `utils/test-ledgers` first (see [utils/test-ledgers/README.md](https://github.com/hyperledger-cacti/cacti-demos/blob/main/utils/test-ledgers/README.md)).

Tear down when done (also before switching to another case — stale chain state and contract addresses will break the next run):

```bash
make clean   # stops compose stacks, removes gateway containers, kills Hardhat nodes (ports 8545-8547)
```

## Demos

Every case has its own README with prerequisites, run steps, expected output, and troubleshooting.

| Demo             | What it shows                                                 | Automations              | Docs                                                                                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oracle case 1    | Gateway as middleware: manual READ/WRITE on EVM               | `make run-oracle-case-1` | [demos/oracle/case_1](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_1/README.md)                                                                                                                                                                                            |
| Oracle case 2    | Auto READ on chain 1, WRITE to chain 2                        | `make run-oracle-case-2` | [demos/oracle/case_2](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_2/README.md)                                                                                                                                                                                            |
| Oracle case 3    | Polling task: periodic READ every 5s                          | `make run-oracle-case-3` | [demos/oracle/case_3](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_3/README.md)                                                                                                                                                                                            |
| Oracle case 4    | Event listening on chain 1 triggers UPDATE on chain 2         | `make run-oracle-case-4` | [demos/oracle/case_4](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_4/README.md)                                                                                                                                                                                            |
| Oracle cases 5-7 | Same oracle patterns against Hyperledger Fabric               | manual only              | [case_5](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_5/README.md), [case_6](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_6/README.md), [case_7](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/oracle/case_7/README.md) |
| SATP case 1      | Fungible token (ERC20) transfer between 2 chains, burn + mint | `make run-satp-case-1`   | [demos/satp/case_1](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/satp/case_1/README.md)                                                                                                                                                                                                |
| SATP case 2      | Non-fungible token (ERC721) transfer between 2 chains         | `make run-satp-case-2`   | [demos/satp/case_2](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/satp/case_2/README.md)                                                                                                                                                                                                |
| SATP case 3      | Fungible transfer across 3 chains (1 -> 2 -> 3 -> 1)          | `make run-satp-case-3`   | [demos/satp/case_3](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/satp/case_3/README.md)                                                                                                                                                                                                |
| Adapter case 1   | SATP adapter layer: webhook-controlled transfers over Besu    | manual only              | [demos/adapter/case_1](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/adapter/case_1/README.md)                                                                                                                                                                                          |
| Carbon credit    | Gateway extension: buy/retire Toucan TCO2 on a Polygon fork   | manual only              | [demos/extensions/carbon-credit](https://github.com/hyperledger-cacti/cacti-demos/blob/main/demos/extensions/carbon-credit/README.md)                                                                                                                                                                      |

`make run-all-cases` runs oracle cases 1-4 and SATP cases 1-2 sequentially with cleanup in between; `make help` lists targets. There is no `make` target for the Fabric, adapter, or carbon-credit cases — follow their READMEs. Gateway config lives inside each case (`config/config.json` for oracle cases, `config/gateway-{1,2}-config.json` for SATP cases) and is mounted into the Docker container by the case's compose file; see the [configuration schema](https://github.com/hyperledger-cacti/cacti-demos/blob/main/docs/satp-gateway-configuration.md).

## Repository layout

- `demos/` — the demos: `oracle/case_1..7`, `satp/case_1..3`, `adapter/case_1`, `extensions/carbon-credit` (each with its own README)
- `utils/test-ledgers/` — Hardhat project: local EVM chains + test contracts; `utils/contracts/fabric-contracts/` — Fabric chaincode used by oracle case 7
- Active workspaces under [examples][examples-index] and [packages][packages-index] — applications and test packages migrated from the cacti repo (e.g. [cacti-starter](examples/cacti-starter/README.md), the fastest way to see Cacti run, or the [CBDC bridging app](examples/cactus-example-cbdc-bridging/README.md)); built by `yarn build:dev:backend` and CI, independent of the `demos/` flows
- `docs/` — documentation index, gateway configuration schema, release notes; `Makefile` — demo automation

## Troubleshooting

- **Port conflicts** — Hardhat uses 8545-8547, the gateway uses 3010/3011/4010 (SATP case 2 runs gateway 2 on 3110/3111/4110). Free them with `make clean` or `lsof -ti:PORT | xargs kill -9`.
- **Gateway can't reach the chain** — start Hardhat with `--hostname 0.0.0.0`, not localhost.
- **Weird behavior after switching cases** — you skipped cleanup. Run `make clean` and restart the case from step 1.
- **`npx hardhat` downloads its own Hardhat** — the root Yarn install doesn't create `node_modules/.bin` links in `utils/test-ledgers`; use `yarn hardhat` instead, or run `npm install` inside `utils/test-ledgers`.
- **`yarn install` fails with lockfile errors** — you're using Yarn 1.x. Run `corepack enable` and retry.

## Documentation

- [Documentation site](https://hyperledger-cacti.github.io/cacti-demos) — hosted guides for the `examples/` and `packages/` workspaces
- [docs/README.md](https://github.com/hyperledger-cacti/cacti-demos/blob/main/docs/README.md) — documentation index and reading path
- [docs/satp-gateway-configuration.md](https://github.com/hyperledger-cacti/cacti-demos/blob/main/docs/satp-gateway-configuration.md) — SATP gateway configuration schema
- [docs/release-1.0.0.md](https://github.com/hyperledger-cacti/cacti-demos/blob/main/docs/release-1.0.0.md) — v1.0.0 release notes (historical record)
- [CONTRIBUTING.md](./CONTRIBUTING.md), [PULL.md](./PULL.md), [AI_GUIDELINES.md](./AI_GUIDELINES.md) — contribution rules

## Verification notes

Verified on macOS (arm64), 2026-09-16, Node 20.20.2: `corepack enable`, `yarn install --immutable`, `yarn build:dev:backend`, `yarn hardhat compile` in `utils/test-ledgers`, and `yarn workspaces list` (all workspaces resolve). The Docker-based demo flows were not executed here; their commands were checked against the repo (compose files, scripts, Makefile targets) and are marked where relevant in the per-demo docs.
<!-- --8<-- [end:content] -->

<!--
=============================================================================
GITHUB REFERENCE LINKS
These links are used when viewing this file directly on GitHub.
The MkDocs wrapper supplies documentation-site destinations instead.
=============================================================================
-->

[examples-index]: ./examples/
[packages-index]: ./packages/
