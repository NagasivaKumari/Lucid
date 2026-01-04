"""
Module: deploy.py
Description: Implementation of deploy.py for Lucid project.
"""

import base64
import json
import os
import time
from dataclasses import dataclass
from pathlib import Path

from algosdk import mnemonic
from algosdk.transaction import ApplicationCreateTxn, OnComplete, StateSchema
from algosdk.v2client.algod import AlgodClient
from dotenv import load_dotenv


@dataclass
class ContractSpec:
    name: str
    global_int: int
    global_bytes: int
    local_int: int
    local_bytes: int


CONTRACTS = [
    ContractSpec(name="donation_pool", global_int=3, global_bytes=1, local_int=1, local_bytes=0),
]


def load_environment(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        raise FileNotFoundError(f"Missing .env file at {dotenv_path}")
    load_dotenv(dotenv_path)


def get_algod_client() -> AlgodClient:
    address = os.environ.get("ALGOD_ADDRESS")
    token = os.environ.get("ALGOD_TOKEN", "")
    if not address:
        raise RuntimeError("ALGOD_ADDRESS must be set in the environment")
    headers = {}
    header_kv = os.environ.get("ALGOD_HEADER_KV", "")
    if header_kv:
        for pair in header_kv.split(";"):
            if not pair.strip():
                continue
            if "=" in pair:
                key, value = pair.split("=", 1)
            elif ":" in pair:
                key, value = pair.split(":", 1)
            else:
                continue
            headers[key.strip()] = value.strip()
    return AlgodClient(token, address, headers=headers or None)


def build_app_schema(contract: ContractSpec) -> tuple[StateSchema, StateSchema]:
    global_schema = StateSchema(num_uints=contract.global_int, num_byte_slices=contract.global_bytes)
    local_schema = StateSchema(num_uints=contract.local_int, num_byte_slices=contract.local_bytes)
    return global_schema, local_schema


def compile_teal(client: AlgodClient, path: Path) -> bytes:
    text = path.read_text()
    response = client.compile(text)
    return base64.b64decode(response["result"])


def wait_for_confirmation(client: AlgodClient, txid: str, timeout: int = 10) -> dict:
    start = time.time()
    while time.time() - start <= timeout:
        result = client.pending_transaction_info(txid)
        if result.get("confirmed-round", 0) > 0:
            return result
        time.sleep(1)
    raise TimeoutError("Transaction not confirmed within timeout")


def deploy_contract(client: AlgodClient, deployer_sk: str, deployer_address: str, spec: ContractSpec) -> int:
    approval = compile_teal(client, Path(f"contracts/{spec.name}_approval.teal"))
    clear = compile_teal(client, Path(f"contracts/{spec.name}_clear.teal"))
    global_schema, local_schema = build_app_schema(spec)
    params = client.suggested_params()
    txn = ApplicationCreateTxn(
        sender=deployer_address,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval,
        clear_program=clear,
        global_schema=global_schema,
        local_schema=local_schema,
    )
    signed = txn.sign(deployer_sk)
    txid = client.send_transaction(signed)
    wait_for_confirmation(client, txid)
    info = client.pending_transaction_info(txid)
    app_id = info.get("application-index")
    print(f"Deployed {spec.name} -> App ID {app_id}")
    return app_id

def persist_app_id(app_id: int, config_path: Path) -> None:
    data = {}
    if config_path.exists():
        try:
            data = json.loads(config_path.read_text())
        except json.JSONDecodeError:
            pass
    data["app_id"] = app_id
    config_path.write_text(json.dumps(data, indent=2))


def main() -> None:
    dotenv_path = Path(os.environ.get("DOTENV_PATH", "backend/.env"))
    load_environment(dotenv_path)
    app_config_path = dotenv_path.parent / "app_config.json"
    algod_client = get_algod_client()
    deployer_mnemonic = os.environ.get("DEPLOYER_MNEMONIC")
    if not deployer_mnemonic:
        raise RuntimeError("DEPLOYER_MNEMONIC must be set to deploy contracts")
    deployer_sk = mnemonic.to_private_key(deployer_mnemonic)
    deployer_address = os.environ.get("DEPLOYER_ADDRESS")
    if not deployer_address:
        raise RuntimeError("DEPLOYER_ADDRESS must be set in .env")
    for contract in CONTRACTS:
        app_id = deploy_contract(algod_client, deployer_sk, deployer_address, contract)
        persist_app_id(app_id, app_config_path)
        print(f"Saved app_id to {app_config_path}")


if __name__ == "__main__":
    main()
