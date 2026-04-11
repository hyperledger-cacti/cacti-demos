# Case 4 — SATP Docker Adapter Layer Demo

This demo demonstrates the SATP Hermes Gateway adapter layer using Docker
with two Besu gateways and a webhook test server. The adapter intercepts
SATP protocol execution points and forwards them to configurable webhook
endpoints for external approval or monitoring.

## Overview

The adapter layer (API Type 3) enables external systems to integrate with
and control SATP transfers through webhook-based communication:

- **Outbound Webhooks**: Gateway notifies external system about SATP events
- **Inbound Webhooks**: External system approves or rejects transfers

## Prerequisites

- Docker
- Node.js >= 18
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- `make`
- `jq`
- `cast` (comes with Foundry)

## Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Build the gateway Docker image
make -f docker-adapter-test.mk build

# 3. Start both Besu test ledgers
make -f docker-adapter-test.mk start-besu

# 4. Deploy SATPWrapper contracts to both networks
make -f docker-adapter-test.mk deploy-contracts

# 5. Generate gateway config files
make -f docker-adapter-test.mk create-configs

# 6. Start the webhook test server
make -f docker-adapter-test.mk start-webhook-server

# 7. Run both gateways
make -f docker-adapter-test.mk run-both

# 8. Check health of both gateways
make -f docker-adapter-test.mk healthcheck-gw1
make -f docker-adapter-test.mk healthcheck-gw2

# 9. Shutdown everything when done
make -f docker-adapter-test.mk shutdown-all
```

## Architecture
┌─────────────────┐         ┌─────────────────┐
│   Gateway 1     │◄───────►│   Gateway 2     │
│  (Besu Leaf 1)  │  SATP   │  (Besu Leaf 2)  │
│  Port: 4010     │         │  Port: 4020     │
└────────┬────────┘         └─────────────────┘
│ adapter webhook
▼
┌─────────────────┐
│  Webhook Test   │
│     Server      │
│  Port: 9223     │
└─────────────────┘

Gateway 1 has an outbound webhook configured at `stage0/before` that
calls the webhook test server before processing each new session request.

## Structure
case_4/
├── README.md                        ← this file
├── docker-adapter-test.mk           ← demo orchestrator (Makefile)
├── adapter-test-server.ts           ← webhook test server
├── package.json                     ← Node.js dependencies
├── tsconfig.json                    ← TypeScript configuration
└── config/
├── README.md                    ← config documentation
├── satp-gateway1-simple-deployed-adapter.config.json
└── adapter/
└── satp-gateway1-simple-deployed-adapter.adapter-config.yml

## Webhook Test Server Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/webhook/outbound/approve` | Always approve (continue: true) |
| POST | `/webhook/outbound/reject` | Always reject (continue: false) |
| POST | `/webhook/outbound/delay/:ms` | Respond after delay |
| POST | `/webhook/outbound/error/:code` | Return HTTP error |
| POST | `/mirror` | Echo request body |
| POST | `/shutdown` | Shutdown server |

## All Available Commands
```bash
make -f docker-adapter-test.mk help
```

## Configuration

Gateway configs are generated dynamically by the Makefile into `/tmp/satp-adapter-test/`.
Static example configs are in the `config/` directory.

The adapter timeout is set to **5 minutes (300000ms)** to allow time
for manual webhook inspection during testing.

## Related

- [SATP Hermes Plugin](https://github.com/hyperledger-cacti/cacti/tree/main/packages/cactus-plugin-satp-hermes)
- [Adapter Layer Documentation](https://github.com/hyperledger-cacti/cacti/tree/main/packages/cactus-plugin-satp-hermes#adapter-layer-api-type-3)
- [Issue #3932](https://github.com/hyperledger-cacti/cacti/issues/3932)
- [cacti-demos repository](https://github.com/hyperledger-cacti/cacti-demos)

