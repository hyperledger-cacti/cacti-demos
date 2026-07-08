
import requests
import json
from time import sleep

TEST_DATA = "DATA WRITTEN TO THE BLOCKCHAIN"
DATA_HASH = "0xd2a21947eed980d6266fd60e26f24379032c4fa65ed8c63b323e040ea2b57536"

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
            "contractAbi": params["abi"],
            "contractName": params["contractName"],
            "contractBytecode": params["bytecode"],
            "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            "methodName": "getData",
            "params": [DATA_HASH]
        },
        'taskMode': 'POLLING',
        'pollingInterval': 5000,
        'taskType': 'READ'
    }

    return register_oracle(req_params)


if __name__ == "__main__":
    print(f"First request will register the task in the oracle...the task will be executed every 5 seconds")
    sleep(5)

    read_response = register_read("../../../utils/test-ledgers/artifacts/contracts/OracleTestContract.sol/OracleTestContract.json")
    print("Response:", read_response)

    print(f"Task ID: {read_response['taskID']}")
