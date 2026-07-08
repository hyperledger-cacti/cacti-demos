# Fabric Oracle Register: POLLING READ and UPDATE Operations on Hyperledger Fabric

This README describes how to run the oracle polling tests that use the SATP Hermes Gateway as middleware to register, poll and unregister tasks against Hyperledger Fabric. The tests exercise the standard `asset-transfer-basic` chaincode through the Gateway plugin endpoints:

- POST /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/execute
- POST /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/register
- POST /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/unregister
- GET  /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/status

The provided test script `oracle-execute-fabric.py` performs three polling scenarios:
- polling_update_fabric: creates an asset, registers a POLLING UPDATE task that updates the asset every 5s, waits, then unregisters and asserts multiple successful UPDATE operations were executed.
- polling_read_fabric: registers a POLLING READ task that calls `GetAllAssets` every 5s, waits, then unregisters and asserts multiple successful READ operations were executed.
- polling_specific_read_fabric: creates a single asset, registers a POLLING READ task that calls `ReadAsset(<id>)` every 5s, waits, then unregisters and asserts the specific asset was read successfully multiple times.

## Requirements

To simulate a Hyperledger Fabric network and run this example, ensure you have cloned the [Hyperledger Fabric Samples repository](https://github.com/hyperledger/fabric-samples).

```bash
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
```

Then, install the Fabric binaries and Docker images by running:

```bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
./install-fabric.sh d s b
```

This will download the necessary Fabric binaries and Docker images.

## Terminal Overview

Before starting, here is a summary of what each terminal will be used for:

- **Terminal 1:** Start Hyperledger Fabric test network and Deploy the asset-transfer-basic chaincode
- **Terminal 2:** Retrieve all keys and certificates from Fabric
- **Terminal 3:** Run the Gateway (Docker Compose)
- **Terminal 4:** Run the Oracle execute script

## Setup Instructions

### 1. Start Hyperledger Fabric Network

In terminal 1, navigate to your Fabric samples directory and start the network:
```bash
cd fabric-samples/test-network
./network.sh down  # Clean up any existing network if needed
./network.sh up createChannel -c mychannel -ca
```

This creates a Fabric network with two organizations (Org1 and Org2) and a channel named `mychannel`.

---

### 2. Deploy the Asset-Transfer-Basic Chaincode

In terminal 1, from the same directory:
```bash
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-typescript -ccl typescript
```

This deploys the `asset-transfer-basic` chaincode to the `mychannel` channel with the contract name `basic`.

---

### 3. Copy Required Certificates and Keys to the Gateway Configuration file (config/gateway-fabric-config.json)

#### Option 1: Script-based Retrieval

In terminal 2, navigate to your Fabric samples directory:

```bash
cd utils
chmod +x getcert.sh && ./getcert.sh > certs.txt
```
And a txt file will be created where you can just copy the keys to the placeholders in [`config/gateway-fabric-config.json`](config/gateway-fabric-config.json).

#### Option 2: Manual Retrieval

In terminal 2, navigate to your Fabric samples directory:

Admin Certificate     -> userIdentity.credentials.certificate
```bash
cat organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/*.pem
```

Admin Private Key     -> userIdentity.credentials.privateKey
```bash
cat organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*_sk
```

Peer0 Org1 CA Cert    -> connectionProfile.peers.peer0.org1.example.com.tlsCACerts.pem
```bash
cat organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

CA Org1 Certificate   -> connectionProfile.certificateAuthorities.ca.org1.example.com.tlsCACerts.pem[0]
```bash
cat organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem
```

Orderer CA Certificate -> connectionProfile.orderers.orderer.example.com.tlsCACerts.pem
```bash
cat organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

---

### 4. Start the Gateway (Docker)

In terminal 3:
```bash
docker compose up
```
This will start the Gateway with the Fabric configuration file.

```bash
docker ps
```
And check if kubaya/cacti-satp-hermes-gateway is healthy, if it proceed

---

### 5. Run the Oracle Polling Test Script

In terminal 4 (this directory where `oracle-register-poller-fabric.py` lives):
```bash
python3 oracle-register-poller-fabric.py
```

What the script does (high level)
- Uses the register endpoint to create assets for tests.
- Registers POLLING tasks via the register endpoint:
    - UPDATE task: updates an asset every 5s (pollingInterval=5000) and asserts between 3 and 5 operations (expecting ≥3 successes).
    - READ task (all assets): calls `GetAllAssets` every 5s and asserts between 2 and 4 successful reads.
    - READ task (specific asset): creates an asset then polls `ReadAsset(<id>)` every 5s and asserts multiple successful reads and that returned asset ID matches.
- Unregisters tasks using the unregister endpoint and checks final status via the status endpoint. The script asserts expected task state (INACTIVE), type (READ/UPDATE), mode (POLLING), and operation counts.

Endpoints used by the script
- execute: POST http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/execute
- register: POST  http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/register
- unregister: POST http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/unregister?taskID=<id>
- status: GET http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/status?taskID=<id>

Notes and assertions
- The script will exit with status 0 on success, 1 on assertion or runtime error.
- The script expects the Gateway plugin to be reachable at localhost:4010 and configured with the Fabric credentials copied into the Gateway configuration.
- Adjust timeouts or pollingInterval if running on slow hosts or CI environments.

Troubleshooting
- If register fails, check gateway logs and ensure the Fabric connection info in `config/gateway-fabric-config.json` is correct.
- If operations are fewer than expected, increase wait times in the script or confirm gateway scheduling is working.

This README matches the flow implemented in `oracle-register-poller-fabric.py`. Run the Fabric network, start the gateway, then execute the script to validate polling register/read/update flows against the `asset-transfer-basic` chaincode.
