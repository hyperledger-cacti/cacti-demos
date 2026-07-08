import requests
import json
import sys

def get_status_oracle(params):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/status endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send with the task ID.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/status"
    headers = {"Content-Type": "application/json"}
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def get_status(task_id):
    """
    Gets the status of an oracle task.

    Args:
        task_id (str): The task ID to check.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'taskID': task_id,
    }

    return get_status_oracle(req_params)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python oracle-evm-check-status.py <TaskID>")
        sys.exit(1)

    task_id = sys.argv[1]

    try:
        response = get_status(task_id)
        print("Task Status:")
        print(json.dumps(response, indent=2))
    except requests.exceptions.HTTPError as e:
        print(f"Error getting status: {e}")
        print(f"Response: {e.response.text}")
        sys.exit(1)