
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


def execute_read_and_update(file_path):
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

    # For simplicity we are using the same contract on both networks, but in a real-world
    # scenario, you would likely have different contracts on different networks, and the
    # parameters would be different as well.
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
        'taskType': 'READ_AND_UPDATE'
    }

    return execute_oracle(req_params)

def execute_read(file_path):
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
        'sourceNetworkId': { 'id': 'HardhatTestNetwork2', 'ledgerType': 'ETHEREUM' },
        'sourceContract': {
            "contractAbi": params["abi"],
            "contractName": params["contractName"],
            "contractBytecode": params["bytecode"],
            "contractAddress": "0xbded0d2bf404bdcba897a74e6657f1f12e5c6fb6",
            "methodName": "getData",
            "params": [DATA_HASH]
        },
        'taskType': 'READ'
    }

    return execute_oracle(req_params)


if __name__ == "__main__":
    print(f"First request will write '{TEST_DATA}' to the blockchain...")
    sleep(5)

    update_response = execute_update("../../../utils/test-ledgers/artifacts/contracts/OracleTestContract.sol/OracleTestContract.json")
    print("Response:", update_response)

    print("Waiting for 5 seconds before reading and updating target chain...")
    sleep(5)

    read_and_update = execute_read_and_update("../../../utils/test-ledgers/artifacts/contracts/OracleTestContract.sol/OracleTestContract.json")
    print("Response:", read_and_update)

    print("Waiting for 5 seconds before reading target chain...")
    sleep(5)

    read_response = execute_read("../../../utils/test-ledgers/artifacts/contracts/OracleTestContract.sol/OracleTestContract.json")
    print("Response:", read_response)
