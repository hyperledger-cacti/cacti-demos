import requests
import json
import sys

def execute_transact(params):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/transact endpoint
    with the given params as JSON body.

    Args:
        params (dict): The JSON payload to send.

    Returns:
        dict: The JSON response from the endpoint.
    """
    url = f"http://localhost:4010/api/v1/@hyperledger/cactus-plugin-satp-hermes/transact"
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=params, headers=headers)
    response.raise_for_status()
    return response.json()

def transact(step):
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/transact endpoint
    with the given file as JSON body.

    Returns:
        dict: The JSON response from the endpoint.
    """
    if step == 1:
        # For the first step, we transfer from Network 1 to Network 2
        req_params = {
            "contextID": 'mockContext',
            "sourceAsset": {
                "id": "ExampleAsset",
                "referenceId": "SATP-ERC20-ETHEREUM",
                "owner": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", # the user's address
                "contractName": "SATPTokenContract",
                "contractAddress": "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512", # the SATP contract address
                "networkId": {
                    "id": "EthereumLedgerTestNetwork1",
                    "ledgerType": "ETHEREUM",
                },
                "tokenType": "NONSTANDARD_FUNGIBLE",
                "amount": "100"
            },
            "receiverAsset": {
                "id": "ExampleAsset",
                "referenceId": "SATP-ERC20-ETHEREUM",
                "owner": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", # the user's address
                "contractName": "SATPTokenContract",
                "contractAddress": "0xbded0d2bf404bdcba897a74e6657f1f12e5c6fb6", # the SATP contract address
                "networkId": {
                    "id": "EthereumLedgerTestNetwork2",
                    "ledgerType": "ETHEREUM",
                },
                "tokenType": "NONSTANDARD_FUNGIBLE",
                "amount": "100"
            }
        }
    elif step == 2:
        # For the second step, we transfer from Network 2 to Network 3
        req_params = {
            "contextID": 'mockContext',
            "sourceAsset": {
                "id": "ExampleAsset",
                "referenceId": "SATP-ERC20-ETHEREUM",
                "owner": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", # the user's address
                "contractName": "SATPTokenContract",
                "contractAddress": "0xbded0d2bf404bdcba897a74e6657f1f12e5c6fb6", # the SATP contract address
                "networkId": {
                    "id": "EthereumLedgerTestNetwork2",
                    "ledgerType": "ETHEREUM",
                },
                "tokenType": "NONSTANDARD_FUNGIBLE",
                "amount": "100"
            },
            "receiverAsset": {
                "id": "ExampleAsset",
                "referenceId": "SATP-ERC20-ETHEREUM",
                "owner": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", # the user's address
                "contractName": "SATPTokenContract",
                "contractAddress": "0x95bd8d42f30351685e96c62eddc0d0613bf9a87a", # the SATP contract address
                "networkId": {
                    "id": "EthereumLedgerTestNetwork3",
                    "ledgerType": "ETHEREUM",
                },
                "tokenType": "NONSTANDARD_FUNGIBLE",
                "amount": "100"
            }
        }
    else:
        # For the third step, we transfer from Network 3 back to Network 1
        req_params = {
            "contextID": 'mockContext',
            "sourceAsset": {
                "id": "ExampleAsset",
                "referenceId": "SATP-ERC20-ETHEREUM",
                "owner": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", # the user's address
                "contractName": "SATPTokenContract",
                "contractAddress": "0x95bd8d42f30351685e96c62eddc0d0613bf9a87a", # the SATP contract address
                "networkId": {
                    "id": "EthereumLedgerTestNetwork3",
                    "ledgerType": "ETHEREUM",
                },
                "tokenType": "NONSTANDARD_FUNGIBLE",
                "amount": "100"
            },
            "receiverAsset": {
                "id": "ExampleAsset",
                "referenceId": "SATP-ERC20-ETHEREUM",
                "owner": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", # the user's address
                "contractName": "SATPTokenContract",
                "contractAddress": "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512", # the SATP contract address
                "networkId": {
                    "id": "EthereumLedgerTestNetwork1",
                    "ledgerType": "ETHEREUM",
                },
                "tokenType": "NONSTANDARD_FUNGIBLE",
                "amount": "100"
            }
        }

    return execute_transact(req_params)

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            update_response = transact(int(sys.argv[1]))
            # Print only the SESSION_ID if present, else print the whole response
            if isinstance(update_response, dict) and 'SESSION_ID' in update_response:
                print(json.dumps({'SESSION_ID': update_response['SESSION_ID']}))
            else:
                print(json.dumps(update_response))
        else:
            print(json.dumps({'error': 'Invalid argument provided. Expected an integer at call time to specify the transaction to run (1, 2 or 3).'}))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
