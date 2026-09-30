# Adapter Case 1: Webhook-Controlled SATP Transfers Over Besu

This demo exercises the **Adapter Layer** of the SATP Hermes gateway: external systems integrate with and control SATP transfers through outbound/inbound webhooks (here: a Stage 0 `newSessionRequest` adapter), with the gateway pair connected to two local Besu networks and pre-deployed bridge contracts.

## Prerequisites

- Docker
- GNU Make
- `curl` and `jq`
- A Docker image named `satp-hermes-gateway-adapter-test:latest` (see next section)

Everything is driven by the makefile in this directory: `docker-adapter-test.mk`. Run all commands from the **repository root**:

```bash
make -f demos/adapter/case_1/docker-adapter-test.mk help
```

## About the Docker image

The makefile's `build` target expects `packages/cactus-plugin-satp-hermes` (the gateway source and `satp-hermes-gateway.Dockerfile`), which lives in the [cacti](https://github.com/hyperledger-cacti/cacti) monorepo, not here. Same for `deploy-contracts` (needs the `SATPWrapperContract` Foundry project) and the webhook test server target.

In this repository, build the image once from a cacti checkout and tag it as the makefile expects:

```bash
# inside a clone of hyperledger-cacti/cacti
docker build --pull --rm \
  -f packages/cactus-plugin-satp-hermes/satp-hermes-gateway.Dockerfile \
  -t satp-hermes-gateway-adapter-test:latest \
  packages/cactus-plugin-satp-hermes
```

After that, all gateway run/test/stop targets below work from this repository.

## Quick start

From the repository root:

```bash
MK=demos/adapter/case_1/docker-adapter-test.mk

# 1. Start both Besu test ledgers (8545/8546 and 8547/8548)
make -f $MK start-besu

# 2. Generate gateway + adapter configs into /tmp/satp-adapter-test
make -f $MK create-configs

# 3. Run both gateways (gateway 1: 3010/3011/4010, gateway 2: 3020/3021/4020)
make -f $MK run-both

# 4. Verify: health, integrations, sessions
make -f $MK test

# 5. When finished
make -f $MK shutdown-all   # stops gateways, Besu ledgers, webhook server
```

`make -f $MK status-all` shows what is running. The `e2e` target chains the full pipeline (contract deployment, image build, both gateways, tests) but depends on the cacti checkout layout, so it only works from a cacti clone.

## What you should see

- `make -f $MK test` prints `{"status": "AVAILABLE"}` from both gateway health endpoints, followed by the integrations list (Besu network per gateway) and an empty session list.
- Gateway 1's adapter config points an outbound webhook at `http://host.docker.internal:9223/webhook/outbound/approve` (port `WEBHOOK_SERVER_PORT`, default 9223). When a SATP session starts, gateway 1 calls this webhook and waits for the response (5-minute timeout — useful for manual testing).
- Adapter logs: `make -f $MK logs-gw1-adapter` (filtered) or `make -f $MK logs-gw1` (full).

## Configuration

- Generated configs land in `/tmp/satp-adapter-test/` (`gateway{1,2}-config.json`, `gateway{1,2}-adapter-config.yml`). Recreate them with `make -f $MK create-configs`, remove with `make -f $MK clean-configs`.
- Reference (static) configs copied from the cacti repo live in [`../config/`](../config/): `satp-gateway1-simple-deployed-adapter.config.json` and `adapter/satp-gateway1-simple-deployed-adapter.adapter-config.yml`. These are what the makefile's legacy single-gateway mode mounts; in this repository the multi-gateway flow above is the supported path.
- Useful overrides (prefix them on any `make` call): `ADAPTER_TIMEOUT_MS` (default 300000), `WEBHOOK_SERVER_PORT` (9223), `TEMP_DIR` (/tmp/satp-adapter-test), `BESU1_RPC_HTTP`, `BESU2_RPC_HTTP`, `GW1_GID`/`GW2_GID`.

The generated adapter config registers one outbound webhook at stage0/`newSessionRequest`/`before` on gateway 1; gateway 2 has no adapters (server side). See the full target list in `docker-adapter-test.mk` (or `make -f $MK help`) for contract deployment, bridge-address retrieval, webhook test server, and log targets.

## Troubleshooting

- **Ports already in use** — gateways: 3010/3011/4010 and 3020/3021/4020; Besu: 8545-8548; webhook server: 9223. Check with `lsof -i :PORT`, then `make -f $MK shutdown-all` and retry.
- **`no such image: satp-hermes-gateway-adapter-test`** — build the image in a cacti checkout as described above; `build` inside this repo fails because `packages/cactus-plugin-satp-hermes` does not exist here.
- **Health check fails right after start** — gateways need a few seconds; `run-gateway1/2` already wait 8s and health-check. If it still fails, inspect `make -f $MK logs-gw1`.
- **`channelName missing` warnings in logs** — expected when only Besu is configured; does not affect Besu operation.
- **`dockerd` warnings inside the container** — expected without a Docker socket mount; does not affect gateway functionality.
- **Fresh start** — `make -f $MK clean-full` removes containers, images, and temp configs.

> Untested here: the Docker-based flows in this demo were not executed in this environment. All targets above were verified against `docker-adapter-test.mk`; the image build step was verified to require the cacti checkout layout.
