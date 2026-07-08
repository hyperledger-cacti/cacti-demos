
import requests
import json
from time import sleep

def register_oracle(params):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/register endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/register"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=params, headers=headers)
    response.raise_for_status()
    return response.json()


def register_read(file_path):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/register" endpoint
    with the given file as JSON body.

    Args:
        file_path (str): The path to the JSON file to send.

    Returns:
        dict: The JSON response from the endpoint.
    """
    with open(file_path, 'r') as file:
        params = json.load(file)

    req_params = {
        'sourceNetworkId': { 'id': 'HardhatTestNetwork1', 'ledgerType': 'ETHEREUM' },
        'sourceContract': {
            "contractName": params["contractName"],
            "contractAbi": params["abi"],
            "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        },
        'destinationNetworkId': { 'id': 'HardhatTestNetwork2', 'ledgerType': 'ETHEREUM' },
        'destinationContract': {
            "contractAbi": params["abi"],
            "contractName": params["contractName"],
            "contractBytecode": params["bytecode"],
            "contractAddress": "0xbded0d2bf404bdcba897a74e6657f1f12e5c6fb6",
            "methodName": "setData",
            # not needed because we will write the data read from the source contract
            # we can still pass it but it will overwrite the data read from the source contract
        },
        'listeningOptions': {
            "eventSignature": "UpdatedData(bytes32,string,uint256)",
            # since the event signature contains mutliple parameters, we need to specify which one we want to use
            "filterParams": ["data"],
        },
        'taskMode': 'EVENT_LISTENING',
        'taskType': 'READ_AND_UPDATE'
    }

    return register_oracle(req_params)


if __name__ == "__main__":
    print(f"First request will register the task in the oracle...the task will be executed whenever there is a new event emitted from the source contract")
    sleep(5)

    read_response = register_read("../../../utils/test-ledgers/artifacts/contracts/OracleTestContract.sol/OracleTestContract.json")
    print("Response:", read_response)

    print(f"Task ID: {read_response['taskID']}")
