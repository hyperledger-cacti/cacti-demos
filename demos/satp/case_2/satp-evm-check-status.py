
import requests
import json
from time import sleep
import sys

def get_satp_session_status(params):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/status endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send with the task ID.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4110/api/v1/@hyperledger/cactus-plugin-satp-hermes/status"
    headers = {"Content-Type": "application/json"}
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def get_status(session_id):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/status endpoint
    with the given file as JSON body.

    Args:
        file_path (str): The path to the JSON file to send.

    Returns:
        dict: The JSON response from the endpoint.
    """

    req_params = {
        'SessionID': session_id,
    }

    return get_satp_session_status(req_params)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python satp-evm-check-status.py <SessionID>")
        sys.exit(1)

    session_id = sys.argv[1]

    response = get_status(session_id)
    print("Response:", response)