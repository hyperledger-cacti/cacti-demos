#!/usr/bin/env python3
import requests
import json
from time import sleep
import sys
import time

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


def unregister_oracle(task_id):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/unregister endpoint
    to unregister a task.

    Args:
        task_id (str): The task ID to unregister.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/unregister"
    params = {"taskID": task_id}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def get_task_status(task_id):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/status endpoint
    to get the status of a task.

    Args:
        task_id (str): The task ID to check.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = "http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/oracle/status"
    params = {"taskID": task_id}
    headers = {"Content-Type": "application/json"}
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def polling_update_fabric():
    """
    Registering a polling UPDATE task on Fabric.
    Updates an asset repeatedly every 5 seconds.
    """
    print("Polling Mode UPDATE on Fabric")
    
    asset_id = f'poll-update-asset-{int(time.time())}'
    print(f"\nCreating initial asset '{asset_id}'")
    
    create_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'CreateAsset',
            'params': [asset_id, 'red', '10', 'InitialOwner', '100']
        },
        'taskType': 'UPDATE'
    }
    
    create_response = execute_oracle(create_params)
    assert create_response['operations'][0]['status'] == 'SUCCESS', "Initial asset creation should succeed"
    print("Initial asset created")
    sleep(2)
    
    # Register a polling task that UPDATES the asset periodically
    
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'UpdateAsset',
            'params': [asset_id, 'yellow', '15', 'PollingUser', '999']
        },
        'taskType': 'UPDATE',
        'taskMode': 'POLLING',
        'pollingInterval': 5000
    }
    
    register_response = register_oracle(req_params)
    print("Response:", json.dumps(register_response, indent=2))
    
    assert 'taskID' in register_response, "Should have taskID"
    task_id = register_response['taskID']
    print(f"\nTask registered with ID: {task_id}")
    
    print("\nWaiting 23 seconds for multiple polling cycles")
    sleep(23)
    
    print("\nUnregistering polling task")
    unregister_response = unregister_oracle(task_id)
    print("Response:", json.dumps(unregister_response, indent=2))
    
    print("\nChecking final task status")
    task_status = get_task_status(task_id)
    print("Response:", json.dumps(task_status, indent=2))
    
    assert task_status['status'] == 'INACTIVE', f"Task should be INACTIVE, got {task_status['status']}"
    assert task_status['type'] == 'UPDATE', f"Task type should be UPDATE, got {task_status['type']}"
    assert task_status['mode'] == 'POLLING', f"Task mode should be POLLING, got {task_status['mode']}"
    
    num_operations = len(task_status.get('operations', []))
    print(f"\nNumber of polling operations executed: {num_operations}")
    assert num_operations >= 3, f"Should have at least 3 operations, got {num_operations}"
    assert num_operations <= 5, f"Should have at most 5 operations, got {num_operations}"
    
    success_count = 0
    for idx, operation in enumerate(task_status.get('operations', [])):
        status = operation.get('status')
        op_type = operation.get('type')
        print(f"  Operation {idx+1}: {status} ({op_type})")
        
        if status == 'SUCCESS':
            success_count += 1
            assert op_type == 'UPDATE', f"Operation type should be UPDATE, got {op_type}"
    
    assert success_count >= 3, f"Should have at least 3 successful operations, got {success_count}"
    
    print("Polling UPDATE task executed successfully")


def polling_read_fabric():
    print("Polling Mode READ on Fabric")

    req_params = {
        'sourceNetworkId': FABRIC_NETWORK_ID,
        'sourceContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'GetAllAssets',
            'params': []
        },
        'taskType': 'READ',
        'taskMode': 'POLLING',
        'pollingInterval': 5000
    }
    
    register_response = register_oracle(req_params)
    print("Response:", json.dumps(register_response, indent=2))
    
    task_id = register_response['taskID']
    print(f"\nPolling READ task registered with ID: {task_id}")
    
    print("\nWaiting 18 seconds for multiple polling cycles")
    sleep(18)
    
    print("\nUnregistering polling task")
    unregister_response = unregister_oracle(task_id)
    print("Response:", json.dumps(unregister_response, indent=2))
    
    print("\nChecking final task status")
    task_status = get_task_status(task_id)
    print("Response:", json.dumps(task_status, indent=2))
    
    assert task_status['status'] == 'INACTIVE', f"Task should be INACTIVE, got {task_status['status']}"
    assert task_status['type'] == 'READ', f"Task type should be READ, got {task_status['type']}"
    assert task_status['mode'] == 'POLLING', f"Task mode should be POLLING, got {task_status['mode']}"
    
    num_operations = len(task_status.get('operations', []))
    print(f"\nNumber of READ operations executed: {num_operations}")
    assert num_operations >= 2, f"Should have at least 2 operations, got {num_operations}"
    assert num_operations <= 4, f"Should have at most 4 operations, got {num_operations}"
    
    # Verify each operation read the assets successfully
    for idx, operation in enumerate(task_status.get('operations', [])):
        status = operation.get('status')
        op_type = operation.get('type')
        print(f"  Operation {idx+1}: {status} ({op_type})")
        
        assert status == 'SUCCESS', f"Operation {idx+1} should be SUCCESS, got {status}"
        assert op_type == 'READ', f"Operation type should be READ, got {op_type}"
        
        # Check that data was read
        output = operation.get('output', {}).get('output')
        if output:
            try:
                assets = json.loads(output)
                print(f"    Read {len(assets)} assets")
            except json.JSONDecodeError:
                print(f"    Output: {output[:100]}")
    
    print("Polling READ task executed successfully")


def polling_specific_read_fabric():
    print("Polling Mode READ Specific Asset on Fabric")
    
    asset_id = f'poll-read-test-{int(time.time())}'
    print(f"\nCreating asset '{asset_id}' to read")
    
    create_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'CreateAsset',
            'params': [asset_id, 'silver', '22', 'TestReader', '777']
        },
        'taskType': 'UPDATE'
    }
    
    create_response = execute_oracle(create_params)
    assert create_response['operations'][0]['status'] == 'SUCCESS', "Asset creation should succeed"
    print("Asset created successfully")
    sleep(2)
    
    # Register polling task to read this specific asset
    print(f"\nRegistering polling task to read '{asset_id}' every 5 seconds")
    
    req_params = {
        'sourceNetworkId': FABRIC_NETWORK_ID,
        'sourceContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'ReadAsset',
            'params': [asset_id]
        },
        'taskType': 'READ',
        'taskMode': 'POLLING',
        'pollingInterval': 5000
    }
    
    register_response = register_oracle(req_params)
    print("Response:", json.dumps(register_response, indent=2))
    
    task_id = register_response['taskID']
    print(f"\nTask registered with ID: {task_id}")
    
    print("\nWaiting 13 seconds for polling cycles")
    sleep(13)
    
    print("\nUnregistering polling task")
    unregister_oracle(task_id)
    
    # Check status
    print("\nChecking final task status")
    task_status = get_task_status(task_id)
    print("Response:", json.dumps(task_status, indent=2))
    
    assert task_status['status'] == 'INACTIVE', "Task should be INACTIVE"
    assert task_status['type'] == 'READ', "Task type should be READ"
    
    num_operations = len(task_status.get('operations', []))
    print(f"\nNumber of operations: {num_operations}")
    assert num_operations >= 2, f"Should have at least 2 operations, got {num_operations}"
    
    # Verify all reads were successful
    for idx, operation in enumerate(task_status.get('operations', [])):
        status = operation.get('status')
        print(f"  Operation {idx+1}: {status}")
        assert status == 'SUCCESS', f"Operation should be SUCCESS, got {status}"
        
        output = operation.get('output', {}).get('output')
        if output:
            asset_data = json.loads(output)
            assert asset_data['ID'] == asset_id, "Should read correct asset"
            print(f"    Successfully read asset: {asset_data['ID']}")
    
    print("Polling task read specific asset successfully")


if __name__ == "__main__":  
    try:
        #Polling UPDATE
        polling_update_fabric()
        sleep(2)
        
        #Polling READ (all assets)
        polling_read_fabric()
        sleep(2)

        #Polling READ (specific asset)
        polling_specific_read_fabric()

        sys.exit(0)
        
    except AssertionError as e:
        print(f"\n\nFAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)