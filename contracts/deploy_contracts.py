"""
Module: deploy_contracts.py
Description: Implementation of deploy_contracts.py for Lucid project.
"""

import os
from dotenv import load_dotenv
from algosdk import account, mnemonic
import base64
import json
import json
from algosdk.v2client import algod

# Load environment variables (backend/.env)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

ALGOD_ADDRESS = os.getenv('ALGOD_ADDRESS')
ALGOD_TOKEN   = os.getenv('ALGOD_TOKEN') or ''
ALGOD_HEADER_KV = os.getenv('ALGOD_HEADER_KV')
DEPLOYER_MNEMONIC = os.getenv('DEPLOYER_MNEMONIC')
if DEPLOYER_MNEMONIC:
    DEPLOYER_MNEMONIC = DEPLOYER_MNEMONIC.strip('"')

if not ALGOD_ADDRESS or not DEPLOYER_MNEMONIC:
    raise RuntimeError('Missing required environment variables: ALGOD_ADDRESS and DEPLOYER_MNEMONIC')

# Prepare algod client (PureStake style headers if needed)
headers = {}
if ALGOD_HEADER_KV:
    # Expected format "Key:Value"
    key, value = ALGOD_HEADER_KV.split(':', 1)
    headers[key.strip()] = value.strip()
client = algod.AlgodClient(algod_token=ALGOD_TOKEN, algod_address=ALGOD_ADDRESS, headers=headers)

# Recover deployer account
private_key = mnemonic.to_private_key(DEPLOYER_MNEMONIC)
sender = account.address_from_private_key(private_key)

def compile_teal(path: str):
    with open(path, 'r') as f:
        source = f.read()
    compile_response = client.compile(source)
    # Algod returns base64-encoded program
    program_b64 = compile_response['result']
    return base64.b64decode(program_b64)



def main():
    # Compile approval and clear programs
    approval_path = os.path.join(os.path.dirname(__file__), 'donation_pool_approval.teal')
    clear_path = os.path.join(os.path.dirname(__file__), 'donation_pool_clear.teal')
    approval_bin = compile_teal(approval_path)
    clear_bin = compile_teal(clear_path)

    # Create application
    params = client.suggested_params()
    txn = future_txn.ApplicationCreateTxn(
        sender,
        params,
        on_complete=future_txn.OnComplete.NoOpOC,
        approval_program=approval_bin,
        clear_program=clear_bin,
        global_schema=future_txn.StateSchema(num_uints=4, num_byte_slices=2),
        local_schema=future_txn.StateSchema(num_uints=0, num_byte_slices=0),
    )
    signed_txn = txn.sign(private_key)
    txid = client.send_transaction(signed_txn)
    print(f'Submitted transaction {txid}')
    try:
        result = future_txn.wait_for_confirmation(client, txid, 4)
        app_id = result['application-index']
        print(f'Deployed application with ID: {app_id}')
        # App ID displayed for manual config
        print(f'App ID: {app_id} (Add this to backend/.env)')
    except Exception as e:
        print(f"Deployment failed: {e}")

if __name__ == '__main__':
    main()
