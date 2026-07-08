import requests
import json

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


def transact():
    """
    Calls the /api/v1/@hyperledger/cactus-plugin-satp-hermes/transact endpoint
    with the given file as JSON body.

    Returns:
        dict: The JSON response from the endpoint.
    """
    req_params = {
        "contextID": 'mockContext',
        "sourceAsset": {
            "id": "ExampleAsset",
            "referenceId": "SATP-ERC721-ETHEREUM",
            "owner": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", # the user's address
            "contractName": "SATPNonFungibleTokenContract",
            "contractAddress": "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512", # the SATP contract address
            "networkId": {
                "id": "EthereumLedgerTestNetwork1",
                "ledgerType": "ETHEREUM",
            },
            "tokenType": "NONSTANDARD_NONFUNGIBLE",
            "amount": "1001"
        },
        "receiverAsset": {
            "id": "ExampleAsset",
            "referenceId": "SATP-ERC721-ETHEREUM",
            "owner": "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", # the user's address
            "contractName": "SATPNonFungibleTokenContract",
            "contractAddress": "0xbded0d2bf404bdcba897a74e6657f1f12e5c6fb6", # the SATP contract address
            "networkId": {
                "id": "EthereumLedgerTestNetwork2",
                "ledgerType": "ETHEREUM",
            },
            "tokenType": "NONSTANDARD_NONFUNGIBLE",
            "amount": "1001"
        }
    }

    return execute_transact(req_params)

if __name__ == "__main__":
    try:
        update_response = transact()
        # Print only the SESSION_ID if present, else print the whole response
        if isinstance(update_response, dict) and 'SESSION_ID' in update_response:
            print(json.dumps({'SESSION_ID': update_response['SESSION_ID']}))
        else:
            print(json.dumps(update_response))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
