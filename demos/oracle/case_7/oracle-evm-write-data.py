import requests
import json

# Configuration
FABRIC_NETWORK_ID = {"id": "FabricLedgerTestNetwork", "ledgerType": "FABRIC_2"}
CONTRACT_NAME = "counter"

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


def write_data(key, data):
    """
    Writes data to Fabric ledger with the given key.
    This emits a 'WriteData' event.

    Args:
        key (str): The key to write to the ledger.
        data (str): The data to write.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'WriteData',
            'params': [key, data]
        },
        'taskType': 'UPDATE'
    }

    response = execute_oracle(req_params)
    return response


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 3:
        print("Usage: python oracle-evm-write-data.py <key> <data>")
        sys.exit(1)
    
    key = sys.argv[1]
    data = sys.argv[2]
    
    try:
        response = write_data(key, data)
        print("Data written successfully:")
        print(json.dumps(response, indent=2))
    except requests.exceptions.HTTPError as e:
        print(f"Error writing data: {e}")
        print(f"Response: {e.response.text}")
        sys.exit(1)