"""
Module: app.py
Description: Implementation of app.py for Lucid project.
"""

from base64 import b64decode, b64encode
import json
import os
from pathlib import Path
from typing import List, Optional

from algosdk.transaction import ApplicationCallTxn, OnComplete
from algosdk.v2client.algod import AlgodClient
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=os.environ.get('DOTENV_PATH', str(env_path)))

APP_CONFIG_PATH = Path(__file__).resolve().parent / 'app_config.json'


def read_app_config() -> Optional[int]:
    if not APP_CONFIG_PATH.exists():
        return None
    try:
        data = json.loads(APP_CONFIG_PATH.read_text())
    except (json.JSONDecodeError, OSError):
        return None
    app_id = data.get('app_id')
    if isinstance(app_id, int):
        return app_id
    if isinstance(app_id, str) and app_id.isdigit():
        return int(app_id)
    return None


def get_current_app_id() -> int:
    configured = read_app_config()
    if configured is not None:
        return configured
    fallback = os.environ.get('APP_ID', '0')
    try:
        return int(fallback)
    except ValueError:
        return 0

ALGOD_ADDRESS = os.environ.get('ALGOD_ADDRESS')
ALGOD_TOKEN = os.environ.get('ALGOD_TOKEN', '')

if not ALGOD_ADDRESS:
    raise RuntimeError('ALGOD_ADDRESS must be set in backend/.env before starting the backend')

algod_headers = {}
ALGOD_HEADER_KV = os.environ.get('ALGOD_HEADER_KV', '')
if ALGOD_HEADER_KV:
    for kv in ALGOD_HEADER_KV.split(';'):
        if not kv.strip():
            continue
        if '=' in kv:
            key, value = kv.split('=', 1)
        elif ':' in kv:
            key, value = kv.split(':', 1)
        else:
            continue
        algod_headers[key.strip()] = value.strip()

algod_client = AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS, headers=algod_headers or None)

app = FastAPI(title='DropPay API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

app.mount('/modules/lute-connect', StaticFiles(directory=os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'lute-connect', 'dist')), name='lute')
app.mount('/modules/algosdk', StaticFiles(directory=os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'algosdk', 'dist')), name='algosdk')
app.mount('/modules/walletconnect-client', StaticFiles(directory=os.path.join(os.path.dirname(__file__), '..', 'node_modules', '@walletconnect', 'client', 'dist', 'esm')), name='wc_client')
app.mount('/modules/walletconnect-qrcode-modal', StaticFiles(directory=os.path.join(os.path.dirname(__file__), '..', 'node_modules', '@walletconnect', 'qrcode-modal', 'dist', 'umd')), name='wc_qrcode')

@app.get('/api/config')
def get_config():
    # Force reload .env to pick up manual changes without restart
    load_dotenv(dotenv_path=os.environ.get('DOTENV_PATH', str(env_path)), override=True)
    
    config = {
        'app_id': get_current_app_id(),
        'algod_url': os.environ.get('ALGOD_ADDRESS'), # Read directly from env after reload
        'algod_token': os.environ.get('ALGOD_TOKEN', ''),
        'walletconnect_project_id': os.environ.get('WALLETCONNECT_PROJECT_ID', ''),
        'genesis_hash': 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
        'genesis_id': 'testnet-v1.0'
    }
    return config

app.mount('/', StaticFiles(directory=os.path.join(os.path.dirname(__file__), '..', 'frontend'), html=True), name='frontend')


class SignedPayload(BaseModel):
    signed: List[str]


class MediaTxRequest(BaseModel):
    app_id: int
    sender: str
    media_hash: str
    metadata: str
    nonce: Optional[str] = None


class VerifyTxRequest(BaseModel):
    app_id: int
    sender: str
    content_hash: str
    ipfs_cid: str


def decode_arg(value: str) -> bytes:
    try:
        return b64decode(value)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f'Invalid base64 payload: {exc}')


def build_app_call(sender: str, app_id: int, app_args: List[bytes]) -> ApplicationCallTxn:
    params = algod_client.suggested_params()
    return ApplicationCallTxn(
        sender,
        params,
        app_id,
        OnComplete.NoOpOC,
        app_args=app_args,
    )


@app.post('/api/unsigned/media/register')
def create_register_payload(payload: MediaTxRequest):
    args = [b'register', decode_arg(payload.media_hash), decode_arg(payload.metadata)]
    if payload.nonce:
        args.append(decode_arg(payload.nonce))
    txn = build_app_call(payload.sender, payload.app_id, args)
    return {'unsigned': [b64encode(txn.serialize()).decode()]}


@app.post('/api/unsigned/media/verify')
def create_verify_payload(payload: VerifyTxRequest):
    args = [b'verify', decode_arg(payload.content_hash), decode_arg(payload.ipfs_cid)]
    txn = build_app_call(payload.sender, payload.app_id, args)
    return {'unsigned': [b64encode(txn.serialize()).decode()]}


@app.post('/api/broadcast')
def broadcast_transactions(payload: SignedPayload):
    if not payload.signed:
        raise HTTPException(status_code=400, detail='Provide at least one signed transaction blob')

    try:
        decoded = [b64decode(txn) for txn in payload.signed]
        txid = algod_client.send_transactions(decoded)
        return {'txid': txid}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))