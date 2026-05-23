
import requests
import json
from time import sleep, time
import os

def call_audit_endpoint(params):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/audit endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send with the task ID.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/audit"
    headers = {"Content-Type": "application/json"}
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def perform_audit(current_time):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/audit endpoint
    with the given file as JSON body.

    Args:
        file_path (str): The path to the JSON file to send.

    Returns:
        dict: The JSON response from the endpoint.
    """

    req_params = {
        'startTimestamp': 0,
        'endTimestamp': current_time,
    }

    return call_audit_endpoint(req_params)

if __name__ == "__main__":
    current_time = int(time() * 1000)  # Current time in milliseconds
    print(f"Performing audit at {current_time}...")
    sleep(5)

    response = perform_audit(current_time)

    if not os.path.exists("audits"):
        os.makedirs("audits")

    with open(f"audits/audit-{current_time}.json", "w") as f:
        response["sessions"] = [json.loads(s) if isinstance(s, str) else s for s in response["sessions"]]
        json.dump(response, f, indent=2)

    print(f"Audit response saved to audits/audit-{current_time}.json")