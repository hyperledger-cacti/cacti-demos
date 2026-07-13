
import requests
import json
from time import sleep

def execute_get_approve_address(params, port):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/approve-address endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = f"http://localhost:{port}/api/v1/@hyperledger/cactus-plugin-satp-hermes/approve-address"
    headers = {"Content-Type": "application/json"}
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()


def get_approve_address_source_chain(transactionNum):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/approve-address endpoint
    with the given file as JSON body.

    Returns:
        dict: The JSON response from the endpoint.
    """
    if transactionNum == 1:
        req_params = {
            'networkId.id': 'EthereumLedgerTestNetwork1',
            'networkId.ledgerType': 'ETHEREUM',
            'tokenType': 'NONSTANDARD_FUNGIBLE',
        }
    elif transactionNum == 2:
        req_params = {
            'networkId.id': 'EthereumLedgerTestNetwork2',
            'networkId.ledgerType': 'ETHEREUM',
            'tokenType': 'NONSTANDARD_FUNGIBLE',
        }
    else:
        req_params = {
            'networkId.id': 'EthereumLedgerTestNetwork3',
            'networkId.ledgerType': 'ETHEREUM',
            'tokenType': 'NONSTANDARD_FUNGIBLE',
        }

    return execute_get_approve_address(req_params, 4010)

def get_approve_address_target_chain(transactionNum):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/approve-address endpoint
    with the given file as JSON body.

    Returns:
        dict: The JSON response from the endpoint.
    """
    if transactionNum == 1:
        req_params = {
            'networkId.id': 'EthereumLedgerTestNetwork2',
            'networkId.ledgerType': 'ETHEREUM',
            'tokenType': 'NONSTANDARD_FUNGIBLE',
        }
    elif transactionNum == 2:
        req_params = {
            'networkId.id': 'EthereumLedgerTestNetwork3',
            'networkId.ledgerType': 'ETHEREUM',
            'tokenType': 'NONSTANDARD_FUNGIBLE',
        }
    else:
        req_params = {
            'networkId.id': 'EthereumLedgerTestNetwork1',
            'networkId.ledgerType': 'ETHEREUM',
            'tokenType': 'NONSTANDARD_FUNGIBLE',
        }

    return execute_get_approve_address(req_params, 4110)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        update_response = get_approve_address_source_chain(int(sys.argv[1]))
        print("Response:", update_response)

        update_response = get_approve_address_target_chain(int(sys.argv[1]))
        print("Response:", update_response)
    else:
        print(json.dumps({'error': 'Invalid argument provided. Expected an integer at call time to specify the respective transaction (1, 2 or 3).'}))
    
    