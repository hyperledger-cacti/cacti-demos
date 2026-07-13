
import requests

# Configuration
FABRIC_NETWORK_ID = {"id": "FabricLedgerTestNetwork", "ledgerType": "FABRIC_2"}
CONTRACT_NAME = "basic"

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


def execute_update():
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'Initialize',
            'params': ['MyToken', 'MT', '18']
        },
        'taskType': 'UPDATE'
    }
    
    create_response = execute_oracle(req_params)
    assert create_response['operations'][0]['status'] == 'SUCCESS', "Initial asset creation should succeed"
    print("Initial asset created")

    return execute_oracle(req_params)

if __name__ == "__main__":
    update_response = execute_update()
    print("Response:", update_response)