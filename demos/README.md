# Getting Started with SATP (Secure Asset Transfer Protocol)

## Table of Contents
- [Getting Started with SATP (Secure Asset Transfer Protocol)](#getting-started-with-satp-secure-asset-transfer-protocol)
  - [Table of Contents](#table-of-contents)
  - [Setting Up Your Gateway](#setting-up-your-gateway)
    - [Gateway Configuration](#gateway-configuration)
    - [Gateway Configuration](#gateway-configuration-1)
    - [Repositories Configuration](#repositories-configuration)
    - [Network Configuration](#network-configuration)
      - [For EVM Networks:](#for-evm-networks)
  - [Running Your Gateway](#running-your-gateway)
    - [Using Docker Compose](#using-docker-compose)
  - [Interacting with Your Gateway](#interacting-with-your-gateway)
    - [API Usage](#api-usage)
      - [Check Gateway Health](#check-gateway-health)

## Setting Up Your Gateway

### Gateway Configuration

Create a configuration file `config.json` for your SATP gateway with the following schema:

```json
{
  // configuration for the gateway to be created
  "gid": {
    <GATEWAY_CONFIG>
  },
  "logLevel": "TRACE",
  "counterPartyGateways": [
    // configuration for other existing gateways, such that they can communicate with one another
    <COUNTERPARTY_GATEWAY_1_CONFIG>,
    <COUNTERPARTY_GATEWAY_2_CONFIG>,
    ...
  ],
  "localRepository": {
    // configuration for the local database used to store logs from the execution of SATP
    <DB_CONNECTION_1>,
    }
  },
  "remoteRepository": {
    // configuration for the remote database used to store logs from the execution of SATP
    <DB_CONNECTION_2>,
  },
  "ccConfig": {
    "bridgeConfig": [
      // configuration for the usage of SATP related endpoints
      <NETWORK_CONFIG_1>,
      <NETWORK_CONFIG_2>,
      ...
    ],
    "oracleConfig": [
      // configuration for the usage of Oracle related endpoints
      <NETWORK_CONFIG_1>,
      <NETWORK_CONFIG_2>,
      ...
    ]
  },
  "environment": "development",
  "enableCrashRecovery": false,
  "ontologyPath": "/opt/cacti/satp-hermes/ontologies"
}
```

### Gateway Configuration

You'll need to configure the gateway to be created and fill in <GATEWAY_CONFIG> and <COUNTERPARTY_GATEWAY_X_CONFIG>.

```json
{
  "id": "mockID",
  "name": "CustomGateway",
  "version": [
    {
      "Core": "v02",
      "Architecture": "v02",
      "Crash": "v02"
    }
  ],
  "connectedDLTs": [
    {
      "id": "BesuLedgerTestNetwork",
      "ledgerType": "BESU_2X"
    }
  ],
  "proofID": "mockProofID10",
  "address": "http://gateway1.satp-hermes",
  "gatewayClientPort": 3011,
  "gatewayServerPort": 3010,
  "gatewayOapiPort": 4010,
  "keyPair": {
    "privateKey": "XXX",
    "publicKey": "XXX"
  },
}
```

### Repositories Configuration

You may need to configure the local and remote repositories to be created and fill in <DB_CONNECTION_X>. This is only necessary if you want to use a custom database to store logs from the execution of SATP. If not specified, the gateway will create a SQlit database.

```json
{
  "client": "<DB_CLIENT>",
  "connection": {
    "host": "<DB_HOST>",
    "user": "<DB_USER>",
    "password": "<DB_PASSWORD>",
    "database": "<DB_DATABASE>",
    "port": <DB_PORT>,
    "ssl": <USE_SSL>
  }
}
```

### Network Configuration

You'll need to configure each blockchain you want to connect to and fill in <NETWORK_CONFIG_X>.

#### For EVM Networks:
```json
{
  "networkIdentification": {
    "id": "EthereumLedgerTestNetwork",
    "ledgerType": "ETHEREUM"
  },
  "signingCredential": {
    "ethAccount": "<YOUR_ETHEREUM_ADDRESS>",
    "secret": "<YOUR PRIVATE KEY>",
    "type": "GETH_KEYCHAIN_PASSWORD"
  },
  "gasConfig": {
    "gas": "<GAS>",
    "gasPrice": "<GAS_PRICE>"
    # or gasLimit, maxFeePerGas, maxPriorityFeePerGas as per EIP1559
  },
  "connectorOptions": {
    "rpcApiHttpHost": "http://<HTTP_HOST>:<HTTP_PORT>",
    "rpcApiWsHost": "ws://<WS_HOST>:<WS_PORT>"
  },
  "claimFormats": [
    1
  ]
}
```

## Running Your Gateway

## Using Docker Compose

1. Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  satp-gateway:
    image: aaugusto11/cacti-satp-hermes-gateway:215ad342b-2025-05-29
    volumes:
      - ./config/gateway-1-config.json:/opt/cacti/satp-hermes/config/config.json
      - ./satp-hermes-gateway/gateway-1/logs:/opt/cacti/satp-hermes/logs
    ports:
      - 3010:3010/tcp # SERVER_PORT
      - 3011:3011/tcp # CLIENT_PORT
      - 4010:4010/tcp # OAPI_PORT
```

2. Start the services:
```bash
# Interactive mode
docker-compose up

# Detached mode
docker-compose up -d
```

3. Stop the services:
```bash
docker-compose down
```

## Interacting with Your Gateway

### API Usage

The SATP Gateway provides a comprehensive REST API (API1) for managing asset transfers. All endpoints are available at `http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/`. The specification of the endpoints can be found in the [OpenAPI Specification](https://github.com/hyperledger-cacti/cacti/blob/1c1d9021d631d08740683e17513d532b60b5ef66/packages/cactus-plugin-satp-hermes/src/main/json/openapi-blo-bundled.json).

#### Check Gateway Health

```bash
curl -X GET http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/healthcheck
```
