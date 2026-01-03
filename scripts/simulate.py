"""
Simple simulation using algosdk to build a 2-txn atomic group:
- Txn 0: Payment from funder -> application address
- Txn 1: ApplicationCall to 'distribute' with recipient accounts

This script requires network params and private keys to be filled in for testing.
"""
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import PaymentTxn, ApplicationNoOpTxn, assign_group_id
from algosdk.future.transaction import LogicSig
import base64

# Placeholder values - replace before running
ALGOD_ADDRESS = "https://testnet-algorand.api.purestake.io/ps2"
ALGOD_TOKEN = "<PURESTAKE_API_KEY>"
HEADERS = {"X-API-Key": ALGOD_TOKEN}

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS, headers=HEADERS)

# Example function to create group
def build_and_send_group(funder_sk, app_id, app_address, recipients, amount_total):
    params = algod_client.suggested_params()

    # Payment to app address
    pay_txn = PaymentTxn(account.address_from_private_key(funder_sk), params.first, app_address, amount_total, None, params)

    # Application call
    app_args = ["distribute".encode()]
    accounts = recipients
    app_call = ApplicationNoOpTxn(account.address_from_private_key(funder_sk), params.first, app_id, app_args, accounts=accounts)

    # assign group
    txns = [pay_txn, app_call]
    assign_group_id(txns)

    # sign
    signed = [txn.sign(funder_sk) for txn in txns]

    # send
    txid = algod_client.send_transactions(signed)
    print("sent group txid:", txid)
    return txid

if __name__ == "__main__":
    print("This is a simulation helper; fill in keys and network params before use.")