# Fabric Oracle Execute: READ and WRITE Operations on Hyperledger Fabric

This example demonstrates how to use the SATP Hermes Gateway as middleware to perform immediate READ and WRITE operations on Hyperledger Fabric. The test interacts with the `asset-transfer-basic` chaincode through the Gateway's `/oracle/execute` endpoint.

For this case, we use the standard **`asset-transfer-basic`** chaincode deployed on Fabric, which provides functions for managing assets:

* **`InitLedger()`** – Initializes the ledger with sample assets
* **`CreateAsset(id, color, size, owner, value)`** – Creates a new asset on the ledger
* **`ReadAsset(id)`** – Retrieves an asset by its ID
* **`UpdateAsset(id, color, size, owner, value)`** – Updates an existing asset
* **`GetAllAssets()`** – Retrieves all assets from the ledger
* **`TransferAsset(id, newOwner)`** – Transfers asset ownership
* **`DeleteAsset(id)`** – Removes an asset from the ledger

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
And check if kubaya/cacti-satp-hermes-gateway is healthy, if it procceed

---

### 5. Run the Oracle Execute Script

In terminal 4, from this directory:
```bash
python3 oracle-execute-fabric.py
```

This script sends POST requests to the Gateway to trigger chaincode functions via `/oracle/execute`.

---

### What It Does

1. **Invalid Function** – Verifies that calling non-existent functions fails gracefully
2. **Create Asset** – Creates a new asset and verifies success
3. **Read Asset** – Reads the created asset and verifies data
4. **Get All Assets** – Retrieves all assets and confirms the created asset is present
5. **Update Asset** – Updates the asset and verifies the changes
6. **Transfer Asset** – Transfers ownership and verifies the new owner
7. **Delete Asset** – Deletes the asset and verifies removal

