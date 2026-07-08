
import requests
import json
from time import sleep

def get_all_session_ids():
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/get-sessions-ids endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send with the task ID.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/get-sessions-ids"
    headers = {"Content-Type": "application/json"}
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()

if __name__ == "__main__":
    response = get_all_session_ids()
    print("Response:", response)