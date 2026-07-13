#!/usr/bin/env python3
import requests
import json
from time import sleep

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


def invalid_function():
    """
    Calling a function that does not exist.
    Should fail gracefully.
    """
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'InvalidFunction',
            'params': []
        },
        'taskType': 'UPDATE'
    }
    
    return execute_oracle(req_params)


def create_asset(asset_id, color, size, owner, value):
    """
    Creating an asset on Fabric.

    Args:
        asset_id (str): The asset ID.
        color (str): The asset color.
        size (str): The asset size.
        owner (str): The asset owner.
        value (str): The appraised value.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'CreateAsset',
            'params': [asset_id, color, size, owner, value]
        },
        'taskType': 'UPDATE'
    }
    
    return execute_oracle(req_params)


def read_asset(asset_id):
    """
    Reading an asset from Fabric.

    Args:
        asset_id (str): The asset ID to read.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'sourceNetworkId': FABRIC_NETWORK_ID,
        'sourceContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'ReadAsset',
            'params': [asset_id]
        },
        'taskType': 'READ'
    }
    
    return execute_oracle(req_params)


def get_all_assets():
    """
    Reading all assets from Fabric.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'sourceNetworkId': FABRIC_NETWORK_ID,
        'sourceContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'GetAllAssets',
            'params': []
        },
        'taskType': 'READ'
    }
    
    return execute_oracle(req_params)


def update_asset(asset_id, color, size, owner, value):
    """
    Updating an asset on Fabric.

    Args:
        asset_id (str): The asset ID to update.
        color (str): The new color.
        size (str): The new size.
        owner (str): The new owner.
        value (str): The new appraised value.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'UpdateAsset',
            'params': [asset_id, color, size, owner, value]
        },
        'taskType': 'UPDATE'
    }
    
    return execute_oracle(req_params)


def transfer_asset(asset_id, new_owner):
    """
    Transferring an asset on Fabric.

    Args:
        asset_id (str): The asset ID to transfer.
        new_owner (str): The new owner.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'TransferAsset',
            'params': [asset_id, new_owner]
        },
        'taskType': 'UPDATE'
    }
    
    return execute_oracle(req_params)


def delete_asset(asset_id):
    """
    Deleting an asset from Fabric.

    Args:
        asset_id (str): The asset ID to delete.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        'destinationNetworkId': FABRIC_NETWORK_ID,
        'destinationContract': {
            'contractName': CONTRACT_NAME,
            'methodName': 'DeleteAsset',
            'params': [asset_id]
        },
        'taskType': 'UPDATE'
    }
    
    return execute_oracle(req_params)


if __name__ == "__main__":
    print("\nCalling invalid function (should fail)")
    try:
        invalid_response = invalid_function()
        print("Response:", json.dumps(invalid_response, indent=2))
        assert invalid_response['operations'][0]['status'] == 'FAILED', "Should have failed"
        print("Function call failed as expected")
    except Exception as e:
        print(f"ERROR: {e}")
    
    sleep(2)
    
    print("\nCreating asset 'asset999'")
    try:
        create_response = create_asset('asset999', 'purple', '25', 'TestUser', '1000')
        print("Response:", json.dumps(create_response, indent=2))
        assert create_response['operations'][0]['status'] == 'SUCCESS', "Should have succeeded"
        task_id = create_response['taskID']
        print(f"Asset created (Task ID: {task_id})")
        
        # Check task status
        status_response = get_task_status(task_id)
        assert status_response['status'] == 'INACTIVE', "Task should be INACTIVE"
        print(f"Task status verified: {status_response['status']}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    sleep(2)
    
    print("\nReading asset 'asset999'")
    try:
        read_response = read_asset('asset999')
        print("Response:", json.dumps(read_response, indent=2))
        assert read_response['operations'][0]['status'] == 'SUCCESS', "Should have succeeded"
        
        output = read_response['operations'][0]['output']['output']
        asset_data = json.loads(output)
        assert asset_data['ID'] == 'asset999', "Asset ID should match"
        assert asset_data['Color'] == 'purple', "Color should match"
        assert asset_data['Owner'] == 'TestUser', "Owner should match"
        print("Asset read and verified")
    except Exception as e:
        print(f"ERROR: {e}")
    
    sleep(2)
    
    #Get all assets
    print("\nReading all assets")
    try:
        all_assets_response = get_all_assets()
        print("Response:", json.dumps(all_assets_response, indent=2))
        assert all_assets_response['operations'][0]['status'] == 'SUCCESS', "Should have succeeded"
        
        output = all_assets_response['operations'][0]['output']['output']
        assets = json.loads(output)
        asset_ids = [asset['ID'] for asset in assets]
        assert 'asset999' in asset_ids, "Created asset should be in the list"
        print(f"Retrieved {len(assets)} assets")
    except Exception as e:
        print(f"ERROR: {e}")
    
    sleep(2)
    
    #Update the asset
    print("\nUpdating asset 'asset999'")
    try:
        update_response = update_asset('asset999', 'gold', '30', 'NewOwner', '2000')
        print("Response:", json.dumps(update_response, indent=2))
        assert update_response['operations'][0]['status'] == 'SUCCESS', "Should have succeeded"
        print("Asset updated")
        
        # Verify the update
        sleep(1)
        verify_response = read_asset('asset999')
        verify_data = json.loads(verify_response['operations'][0]['output']['output'])
        assert verify_data['Color'] == 'gold', "Color should be updated"
        assert verify_data['Owner'] == 'NewOwner', "Owner should be updated"
        print("Update verified")
    except Exception as e:
        print(f"ERROR: {e}")
    
    sleep(2)
    
    #Transfer the asset
    print("\nTransferring asset 'asset999' to 'FinalOwner'")
    try:
        transfer_response = transfer_asset('asset999', 'FinalOwner')
        print("Response:", json.dumps(transfer_response, indent=2))
        assert transfer_response['operations'][0]['status'] == 'SUCCESS', "Should have succeeded"
        print("Asset transferred")
        
        # Verify the transfer
        sleep(1)
        verify_response = read_asset('asset999')
        verify_data = json.loads(verify_response['operations'][0]['output']['output'])
        assert verify_data['Owner'] == 'FinalOwner', "Owner should be transferred"
        print("Transfer verified")
    except Exception as e:
        print(f"ERROR: {e}")
    
    sleep(2)
    
    #Delete the asset
    print("\nDeleting asset 'asset999'")
    try:
        delete_response = delete_asset('asset999')
        print("Response:", json.dumps(delete_response, indent=2))
        assert delete_response['operations'][0]['status'] == 'SUCCESS', "Should have succeeded"
        print("Asset deleted")
        
        # Verify deletion
        sleep(1)
        try:
            verify_response = read_asset('asset999')
            if verify_response['operations'][0]['status'] == 'FAILED':
                print("Deletion verified: Asset not found")
        except Exception as e:
            print(f"Deletion verified: Asset not found - {e}")
    except Exception as e:
        print(f"ERROR: {e}")
    
    sleep(2)
    
    print("\nCOMPLETED")