import requests
import json

# Configuration
FABRIC_NETWORK_ID = {"id": "FabricLedgerTestNetwork", "ledgerType": "FABRIC_2"}
CONTRACT_NAME = "counter"


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


def register_listener():
    """
    Registers an event listener that listens for 'WriteData' events
    and automatically calls WriteDataNoEvent with the event data.

    Returns:
        dict: The JSON response containing the task ID.
    """
    req_params = {
        'sourceNetworkId': FABRIC_NETWORK_ID,
        'sourceContract': {
            'contractName': CONTRACT_NAME,
        },
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'WriteDataNoEvent',
            # The 'data' parameter will be auto-filled from the event payload
        },
        'listeningOptions': {
            "eventSignature": "WriteData",
            "filterParams": ["data"],  # Extract 'data' field from event
        },
        'taskType': 'READ_AND_UPDATE',
        'taskMode': 'EVENT_LISTENING',
    }

    return register_oracle(req_params)


if __name__ == "__main__":
    print("Registering event listener for 'WriteData' events...")
    print("When a WriteData event is emitted, the listener will automatically call WriteDataNoEvent")
    print()
    
    try:
        response = register_listener()
        print("Event listener registered successfully!")
        print(f"Task ID: {response.get('taskID')}")
        print()
        print("Full response:")
        print(json.dumps(response, indent=2))
    except requests.exceptions.HTTPError as e:
        print(f"Error registering listener: {e}")
        print(f"Response: {e.response.text}")
        import sys
        sys.exit(1)