import requests
import json
import sys

def unregister_oracle(params):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/unregister endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send with the task ID.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/unregister"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def unregister(task_id):
    """
    Unregisters an oracle task.

    Args:
        task_id (str): The task ID to unregister.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'taskID': task_id,
    }

    return unregister_oracle(req_params)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python oracle-evm-unregister.py <TaskID>")
        sys.exit(1)

    task_id = sys.argv[1]

    try:
        response = unregister(task_id)
        print("Task unregistered successfully!")
        print("Response:")
        print(json.dumps(response, indent=2))
    except requests.exceptions.HTTPError as e:
        print(f"Error unregistering task: {e}")
        print(f"Response: {e.response.text}")
        sys.exit(1)