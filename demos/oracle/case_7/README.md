# Fabric Oracle Event Listener: EVENT_LISTENING Operations on Hyperledger Fabric

This README describes how to run the oracle event listening tests that use the SATP Hermes Gateway as middleware to register event listeners and automatically execute actions in response to Hyperledger Fabric events. The tests exercise the custom `Counter` chaincode through the Gateway plugin endpoints:

- POST /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/execute
- POST /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/register
- POST /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/unregister
- GET /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/status

## Test Scenario Overview

The test demonstrates event-driven automation:

1. **Verify Initial State**: Confirms that 'newKey' does not exist in the ledger
2. **Register Event Listener**: Sets up a listener that monitors for 'WriteData' events and automatically calls `WriteDataNoEvent` when the event fires
3. **Trigger Event**: Calls `WriteData` which stores data and emits a 'WriteData' event
4. **Wait for Processing**: Allows time for the listener to catch the event and execute the action
5. **Verify Listener Worked**: Reads 'newKey' to confirm the listener automatically wrote data
6. **Cleanup**: Unregisters the event listener

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

- **Terminal 1:** Start Hyperledger Fabric test network and Deploy the `Counter` chaincode
- **Terminal 2:** Retrieve all keys and certificates from Fabric
- **Terminal 3:** Run the Gateway (Docker Compose)
- **Terminal 4:** Run the Oracle test scripts

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

### 2. Deploy the Counter Chaincode

In terminal 1, from the same directory:

```bash
./network.sh deployCC -ccn counter -ccp ../../../utils/contracts/fabric-contracts/counter-contract/chaincode-javascript/ -ccl javascript
```

This deploys the `counter` chaincode to the `mychannel` channel with the contract name `counter`.

---

### 3. Copy Required Certificates and Keys to the Gateway Configuration file (config/gateway-fabric-config.json)

#### Option 1: Script-based Retrieval

In terminal 2:

```bash
cd utils
chmod +x getcert.sh && ./getcert.sh > certs.txt
```

And a txt file will be created where you can just copy the keys to the placeholders in [`config/gateway-fabric-config.json`](config/gateway-fabric-config.json).

#### Option 2: Manual Retrieval

In terminal 2, navigate to your Fabric samples directory:

Admin Certificate -> userIdentity.credentials.certificate

```bash
cat organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/*.pem
```

Admin Private Key -> userIdentity.credentials.privateKey

```bash
cat organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*_sk
```

Peer0 Org1 CA Cert -> connectionProfile.peers.peer0.org1.example.com.tlsCACerts.pem

```bash
cat organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
```

CA Org1 Certificate -> connectionProfile.certificateAuthorities.ca.org1.example.com.tlsCACerts.pem[0]

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

This will start the Gateway with the Fabric configuration file in `config/gateway-fabric-config.json`.

```bash
docker ps
```

And check if `kubaya/cacti-satp-hermes-gateway` is healthy, if it proceed

---

### 5. Run the Oracle Event Listener Test

In terminal 4, you can run the different scripts to perform the test scenario:

**Step 1: Verify Initial State**

```bash
python3 oracle-evm-read-data.py newKey
```

Expected: Error message saying "there is no data stored in the ledger with key: newKey"  
This is correct - the key doesn't exist yet!

**Step 2: Register Event Listener**

```bash
python3 oracle-evm-register-listener.py
```

Save the `Task_ID` from the output, and check that the status is `ACTIVE`. The event listener is listening for 'WriteData' events, and will call `WriteDataNoEvent` when the event is detected with the data from the event.

**Step 3: Trigger the Event**

```bash
python3 oracle-evm-write-data.py eventTestKey "data from event listener"
```

This calls WriteData which emits the 'WriteData' event.

**Step 4: Wait for Processing**

```bash
sleep 10
```

Give the listener time to catch the event and execute WriteDataNoEvent.

**Step 5: Check Task Status (Optional)**

```bash
python3 oracle-evm-check-status.py <TASK_ID>
```

Replace `TASK_ID` with the Task ID from Step 2.

**Step 6: Verify the Listener Worked**

```bash
python3 oracle-evm-read-data.py newKey
```

Expected: Success! The data should be returned.  
This proves the event listener caught the event and wrote the data!

**Step 7: Cleanup**

```bash
python3 oracle-evm-unregister.py <TASK_ID>
```

Replace `<TASK_ID>` with the Task ID from Step 2, and check that the status is `INACTIVE`. The event listener has been unregistered, the test is complete.

---

## Cleanup

To clean up after testing:

```bash
# Stop the gateway (Terminal 3)
docker compose down

# Stop the Fabric network (Terminal 1)
cd fabric-samples/test-network
./network.sh down

# Optional: Remove Docker network
docker network rm fabric_test
```
