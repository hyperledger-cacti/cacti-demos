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


def read_data(key):
    """
    Reads data from Fabric ledger for the given key.

    Args:
        key (str): The key to read from the ledger.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'sourceNetworkId': FABRIC_NETWORK_ID,
        'sourceContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'ReadData',
            'params': [key]
        },
        'taskType': 'READ'
    }

    response = execute_oracle(req_params)
    return response


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python oracle-evm-read-data.py <key>")
        sys.exit(1)
    
    key = sys.argv[1]
    
    try:
        response = read_data(key)
        print("Data read successfully:")
        print(json.dumps(response, indent=2))
    except requests.exceptions.HTTPError as e:
        print(f"Error reading data: {e}")
        print(f"Response: {e.response.text}")
        sys.exit(1)