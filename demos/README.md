# Demos

Each subdirectory is a self-contained demo with its own README (prerequisites, run steps, expected output, teardown, troubleshooting). Start with the root [README](../README.md) for installation.

## Oracle (demos/oracle)

The gateway acts as middleware for reading from and writing to blockchains.

| Case | Pattern                                              | Ledger        | README                            |
| ---- | ---------------------------------------------------- | ------------- | --------------------------------- |
| 1    | Manual READ + WRITE                                  | EVM (Hardhat) | [case_1](oracle/case_1/README.md) |
| 2    | Auto READ on chain 1, WRITE to chain 2               | EVM           | [case_2](oracle/case_2/README.md) |
| 3    | Polling task, periodic READ (5s)                     | EVM           | [case_3](oracle/case_3/README.md) |
| 4    | Event listening triggers READ_AND_UPDATE cross-chain | EVM           | [case_4](oracle/case_4/README.md) |
| 5    | Manual READ + WRITE                                  | Fabric        | [case_5](oracle/case_5/README.md) |
| 6    | Polling READ + UPDATE                                | Fabric        | [case_6](oracle/case_6/README.md) |
| 7    | Event listening (custom `counter` chaincode)         | Fabric        | [case_7](oracle/case_7/README.md) |

Cases 1-4 use the `OracleTestContract` from [utils/test-ledgers](../utils/test-ledgers/README.md) and can be run via `make run-oracle-case-<N>`. Cases 5-7 require a local [fabric-samples](https://github.com/hyperledger/fabric-samples) test network — follow their READMEs.

## SATP (demos/satp)

Secure Asset Transfer Protocol: the gateway pair burns the asset on the source chain and mints a representation on the destination chain.

| Case | Asset                            | Topology | README                          |
| ---- | -------------------------------- | -------- | ------------------------------- |
| 1    | Fungible (ERC20)                 | 2 chains | [case_1](satp/case_1/README.md) |
| 2    | Non-fungible (ERC721)            | 2 chains | [case_2](satp/case_2/README.md) |
| 3    | Fungible, 3 sequential transfers | 3 chains | [case_3](satp/case_3/README.md) |

All SATP cases can be run via `make run-satp-case-<N>`.

## Adapter (demos/adapter)

| Case | Pattern                                                                        | README                             |
| ---- | ------------------------------------------------------------------------------ | ---------------------------------- |
| 1    | Adapter layer: external systems control SATP transfers via webhooks, over Besu | [case_1](adapter/case_1/README.md) |

Manual setup only. Reference configs live in [adapter/config](adapter/config/).

## Extensions (demos/extensions)

| Case          | Pattern                                                                       | README                                              |
| ------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| carbon-credit | Gateway CARBON_CREDIT extension: buy and retire Toucan TCO2 on a Polygon fork | [carbon-credit](extensions/carbon-credit/README.md) |

Manual setup only.

## Gateway configuration

Each case mounts its configuration (`config/config.json` or `config/gateway-{1,2}-config.json`) into the gateway container. The configuration schema is documented in [docs/satp-gateway-configuration.md](../docs/satp-gateway-configuration.md).

## Cleanup between cases

Run `make clean` from the repository root before switching cases. It stops the compose stacks, removes leftover gateway containers, and kills processes on ports 8545-8547. Skipping this leaves stale chain state and contract addresses that will break the next case.
