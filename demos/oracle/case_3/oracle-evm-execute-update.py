
import requests
import json
from time import sleep

TEST_DATA = "DATA WRITTEN TO THE BLOCKCHAIN"
DATA_HASH = "0xd2a21947eed980d6266fd60e26f24379032c4fa65ed8c63b323e040ea2b57536"

def execute_oracle(params):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/execute endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/execute"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=params, headers=headers)
    response.raise_for_status()
    return response.json()


def execute_update(file_path):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/execute endpoint
    with the given file as JSON body.

    Args:
        file_path (str): The path to the JSON file to send.

    Returns:
        dict: The JSON response from the endpoint.
    """
    with open(file_path, 'r') as file:
        params = json.load(file)

    req_params = {
        'destinationNetworkId': { 'id': 'HardhatTestNetwork1', 'ledgerType': 'ETHEREUM' },
        'destinationContract': {
            "contractAbi": params["abi"],
            "contractName": params["contractName"],
            "contractBytecode": params["bytecode"],
            "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            "methodName": "setData",
            "params": [TEST_DATA]
        },
        'taskType': 'UPDATE'
    }

    return execute_oracle(req_params)

if __name__ == "__main__":
    update_response = execute_update("../../../utils/test-ledgers/artifacts/contracts/OracleTestContract.sol/OracleTestContract.json")
    print("Response:", update_response)