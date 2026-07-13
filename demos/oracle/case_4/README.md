# Case 4: Cross-Chain EVENT\_LISTENING with READ\_AND\_UPDATE Tasks

This test case illustrates how the **Gateway** can register a **READ\_AND\_UPDATE** task using **EVENT\_LISTENING mode** across two **EVM-based blockchains**. Instead of polling periodically, the Gateway listens for a specific **event emitted** by a smart contract on the **source blockchain**, and then triggers a **write operation** on a **destination blockchain** using filtered parameters from the event.

For this, we will use the `OracleTestContract` contract, which is a simple contract that allows us to store and retrieve data. The contract has two functions:

- **`setData(string memory data)`** – Stores data on-chain and associates it with a `bytes32` ID. The method emits an `UpdatedData` event with the stored data.
- **`getData(bytes32 id)`** – Retrieves data from the contract by its ID.

---

## Flow Summary

1. Register a **READ\_AND\_UPDATE task** with `EVENT_LISTENING` mode.
2. Observe an `eth_subscribe` request in the logs of Blockchain 1 (Terminal 2).
3. Trigger `setData(...)` on the contract deployed on Blockchain 1.
4. The Gateway captures the event and extracts the `data` field via `filter_params`.
5. It writes this data to the contract deployed on **Blockchain 2**.
6. Check the task status to inspect the `operations` array and verify the update.
7. Unregister the task and observe `eth_unsubscribe` in Terminal 2.

---

## Terminal Overview

Before starting, here is a summary of what each terminal will be used for in this case:

- **Terminal 1:** Run the Gateway (Docker Compose)
- **Terminal 2:** Start Hardhat EVM Blockchain 1 (port 8545)
- **Terminal 3:** Start Hardhat EVM Blockchain 2 (port 8546)
- **Terminal 4:** Deploy the OracleTestContract smart contract to both blockchains
- **Terminal 5:** Register event listening task and trigger contract events
- **Terminal 8:** Unregister the event listening task

This pattern is similar in other Oracle cases:

- **Gateway terminal** (usually Terminal 1): Always run the Gateway via Docker Compose
- **EVM/Hardhat terminals** (usually Terminals 2, 3): Start one or more local blockchains
- **Deployment/Script terminals** (Terminals 4+): Deploy contracts and run interaction scripts

Refer to each case's README for the exact mapping and steps.

## Setup Instructions

### 1. Start the Gateway (Docker)

In Terminal 1, from this directory:

```bash
docker compose up
```

This will start the Gateway with the corresponding configuration file located in `./config/config-oracle-1-evm-requests.json`.

---

### 2. Start the Hardhat EVM Blockchains

In terminal 2, from this directory, run:

```bash
cd ../../../utils/test-ledgers && npx hardhat node --hostname 0.0.0.0 --port 8545
```

In terminal 3, from this directory, run:

```bash
cd ../../../utils/test-ledgers && npx hardhat node --hostname 0.0.0.0 --port 8546
```

> ⚠️ Make sure to use `--hostname 0.0.0.0` on both cases so that the Gateway (inside Docker) can access the local Hardhat node.

### 3. Deploy the Smart Contract

In terminal 4, from this directory, run:

```bash
cd ../../../utils/test-ledgers && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1
cd ../../../utils/test-ledgers && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat2
```

> This deploys the `OracleTestContract` to the running Hardhat networks (`hardhat1` and `hardhat2` should be configured in `hardhat.config.js` to point to `http://0.0.0.0:8545` and `http://0.0.0.0:8546` respectively).

---

### 4. Register the Event Listening Task

In Terminal 5:

```bash
python3 oracle-evm-register-listener.py
```

> This sends a `POST /oracle/register` request to start listening for the `UpdatedData` event on Blockchain 1, and write filtered values to Blockchain 2.

**Expected Result**:

- In Terminal 2 (Blockchain 1), observe an `eth_subscribe` log line confirming the event subscription.
- In Terminal 5, you should see a response indicating the task is registered successfully and currently `ACTIVE`. Also, note the `Task ID` for future reference.

---

### 5. Trigger the Event in Source Chain

In Terminal 5:

```bash
python3 oracle-evm-execute-update.py
```

> This calls `setData(...)` on Blockchain 1, which emits the `UpdatedData` event.

**Expected Result**:

- In **Terminal 2 (Blockchain 1)**, see the `setData` transaction.
- In **Terminal 3 (Blockchain 2)**, observe the write operation triggered by the Gateway.

---

### 6. Check Task Status and Operations

In Terminal 5:

```bash
python3 oracle-evm-check-status.py <TASK_ID>
```

**Expected Output**:

- Status: `ACTIVE`
- The `operations` array should include the triggered `setData` operation on Blockchain 2.

---

### 7. Unregister the Task

In Terminal 8:

```bash
python3 oracle-evm-unregister.py <TASK_ID>
```

**Expected Result**:

- In **Terminal 2 (Blockchain 1)**, observe an `eth_unsubscribe` log, confirming the removal of the event listener.

---

### 8. Check Task Status and Operations

In Terminal 5:

```bash
python3 oracle-evm-check-status.py <TASK_ID>
```

**Expected Result**:

- Check the task status again. It should now be `INACTIVE`.

---

## Summary

This test demonstrates reactive, event-driven orchestration across blockchains using the Gateway's **EVENT\_LISTENING** capability. It shows how smart contract events on one chain can automatically trigger state changes on another — a crucial pattern for cross-chain automation, bridges, or off-chain workflows.

Finally, you can access the `./satp-hermes-gateway/logs/` directory (relative to this case folder) to see the logs generated by the Gateway. The logs will contain detailed information about the requests and responses, including any errors or warnings that may have occurred during the process.
