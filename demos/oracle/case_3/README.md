# Case 3: Registering a Polling Task to Periodically READ from EVM-based Blockchain

This test case showcases how the **Gateway** can be used to register a **polling task** that automatically reads data from a smart contract at a fixed interval — in this case, **every 5 seconds**. This feature enables continuous monitoring of blockchain state without requiring repeated manual requests.

For this, we will use the `OracleTestContract` contract, which is a simple contract that allows us to store and retrieve data. The contract has two functions:

* **`setData(string memory data)`** – Stores data on-chain and associates it with a `bytes32` ID.
* **`getData(bytes32 id)`** – Retrieves data from the contract by its ID.

---

## Flow Summary

1. Register a **polling task** via the Gateway that attempts to read from the contract.
2. Initially observe **failed** `getData` calls (because no data is stored yet).
3. Trigger a **write** using `setData` to update the contract.
4. See the polling task begin to **succeed** on each interval.
5. Check the status of the task, including historical output.
6. Finally, unregister the task to stop polling.

---


## Terminal Overview

Before starting, here is a summary of what each terminal will be used for in this case:

- **Terminal 1:** Run the Gateway (Docker Compose)
- **Terminal 2:** Start Hardhat EVM Blockchain (port 8545)
- **Terminal 3:** Deploy the OracleTestContract smart contract
- **Terminal 4:** Register the polling task via Gateway
- **Terminal 5:** Trigger a write to the contract
- **Terminal 6:** Check polling task status
- **Terminal 7:** Unregister the polling task

This pattern is similar in other Oracle cases:
- **Gateway terminal** (usually Terminal 1): Always run the Gateway via Docker Compose
- **EVM/Hardhat terminal(s)** (usually Terminal 2, sometimes 2 and 3): Start one or more local blockchains
- **Deployment/Script terminal(s)** (Terminals 3+): Deploy contracts and run interaction scripts

Refer to each case's README for the exact mapping and steps.

## Setup Instructions

### 1. Start the Gateway (Docker)

In terminal 1, from this directory:

```bash
docker compose up
```

This will start the Gateway with the corresponding configuration file located in `./config/config-oracle-1-evm-requests.json`.

---

### 2. Start the Hardhat EVM Blockchain



In terminal 2, from this directory, run:

```bash
cd ../../../utils/test-ledgers && npx hardhat node --hostname 0.0.0.0 --port 8545
```

> ⚠️ Make sure to use `--hostname 0.0.0.0` so that the Gateway (inside Docker) can access the local Hardhat node.

---


### 3. Deploy the Smart Contract


In terminal 3, from this directory, run:

```bash
cd ../../../utils/test-ledgers && npx hardhat ignition deploy ./ignition/modules/OracleTestContract.js --network hardhat1
```

> This deploys the `OracleTestContract` to the running Hardhat network (`hardhat1` should be configured in `hardhat.config.js` to point to `http://0.0.0.0:8545`).

---

### 4. Register the Polling Task

In terminal 4, from this directory:

```bash
python3 oracle-evm-register-poller.py
```

> This script registers a polling task that reads from `getData` every 5 seconds via the Gateway's `/oracle/register` endpoint. You should see:

* Status: `ACTIVE`
* Task ID: `<TASK_ID>` (save this ID because it will be used in later steps)

---

### 5. Observe Failing Reads (Expected)

Check terminal 2 (Hardhat logs). You should see repeated failed `getData` calls due to the fact that no data is yet stored in the contract.

---

### 6. Trigger a Write to the Contract

In terminal 5, run:

```bash
python3 oracle-evm-execute-update.py
```

> This sends a request to the Gateway to invoke `setData`, storing new data in the contract.

---

### 7. Observe Successful Reads

Now return to terminal 2. The previously failing `getData` calls should start succeeding every 5 seconds, reflecting the new contract state.

---

### 8. Get Task Status

In terminal 6, from this directory:

```bash
python3 oracle-evm-check-status.py <TASK_ID>
```

> This queries the Gateway's `/oracle/status` endpoint to inspect the current polling task. You should see:

* Status: `ACTIVE`
* Output history from each execution

---

### 9. Unregister the Task

In terminal 7:

```bash
python3 oracle-evm-unregister.py <TASK_ID>
```

> This stops the polling task by calling the `/oracle/unregister` endpoint.

---

### Final Check: Task Status

Re-run the status script:

```bash
python3 oracle-evm-check-status.py <TASK_ID>
```

You should now see:

* Status: `INACTIVE`
* Historical outputs available in the `outputs` field

---

## ✅ Summary

This case demonstrates the Gateway’s polling capability to monitor blockchain state at regular intervals, enabling near-real-time integration with smart contracts. This is especially useful for automation, data feeds, and triggering external events when on-chain state changes. Note that the use of different `taskType` values (e.g., `READ`, `UPDATE`, `READ_AND_UPDATE`) can be used to customize the behavior of the polling task (e.g., every 5 seconds read data from the source chain contract and write it to the destination chain contract).


Finally, you can access the `./satp-hermes-gateway/logs/` directory (relative to this case folder) to see the logs generated by the Gateway. The logs will contain detailed information about the requests and responses, including any errors or warnings that may have occurred during the process.
