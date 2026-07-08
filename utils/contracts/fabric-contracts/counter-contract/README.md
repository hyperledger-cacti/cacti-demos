# counter-contract README

## Overview
This repository contains a simple Hyperledger Fabric chaincode contract implemented in JavaScript. The contract provides two operations:
- `WriteData(key, data)` — store a value under the given key and emit a `WriteData` event.
- `ReadData(key)` — return the stored value for a given key.

Contract class name: `Counter` (extend `Contract` from `fabric-contract-api`).

Note: ensure the module export matches the class (should export `Counter`).

## Requirements
- Node.js (LTS)
- Hyperledger Fabric CLI and network (peer, orderer, channel)
- Fabric SDK for JavaScript if using an application

## Installation
1. cd into the contract directory:
    cd utils/contracts/fabric-contracts/counter-contract
2. Install dependencies:
    npm install

## Packaging & Deploying (Fabric lifecycle v2.x — summary)
1. npm pack to create a tarball (or follow your packaging flow).
2. peer lifecycle chaincode install <package>.tgz
3. peer lifecycle chaincode approveformyorg ...
4. peer lifecycle chaincode commit ...
(See Fabric docs for full lifecycle commands and options.)

## Contract API

### WriteData(ctx, key, data)
- Description: Stores `data` under `key`.
- Validation: throws if `key` is empty.
- State change: `putState(key, Buffer.from(data))`
- Event: emits `WriteData` with payload `{ "key": "<key>" }`
- Returns: `true` on success

### ReadData(ctx, key)
- Description: Reads value stored at `key`.
- Validation: throws if `key` is empty or if key does not exist.
- Returns: the stored value as a string

## Example CLI Usage
Invoke write:
peer chaincode invoke -C mychannel -n counter -c '{"Args":["WriteData","myKey","some value"]}' --waitForEvent

Query read:
peer chaincode query -C mychannel -n counter -c '{"Args":["ReadData","myKey"]}'

## Example JavaScript (application)
const gateway = ...; // set up Gateway and Wallet
const network = await gateway.getNetwork('mychannel');
const contract = network.getContract('counter');

await contract.submitTransaction('WriteData', 'myKey', 'some value');
const result = await contract.evaluateTransaction('ReadData', 'myKey');
console.log(result.toString());

Listen for events:
const listener = async (event) => {
  if (event.eventName === 'WriteData') {
     const payload = JSON.parse(event.payload.toString());
     console.log('WriteData event for key:', payload.key);
  }
};
await contract.addContractListener(listener);

## Error handling
- Passing an empty `key` throws: "Key must be a non-empty string".
- Reading a non-existent key throws: "the key <key> does not exist".

## Notes
- Confirm the exported module matches the contract class; change `module.exports = TokenERC20Contract;` to `module.exports = Counter;`.
- Contract uses simple string storage. For complex objects, serialize/deserialize JSON manually.

## License
The contract source includes an SPDX license identifier (Apache-2.0). Respect the license when reusing code.

For more details on packaging, lifecycle, and SDK usage see the official Hyperledger Fabric documentation.