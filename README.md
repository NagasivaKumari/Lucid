# Lucid

Lucid is an Algorand-native experimentation workspace that bundles two PyTeal smart contracts (the donation pool and the UMIS weighted payout engine), a lightweight backend proxy, and a prototype dashboard experience.

## Structure
- `contracts/` holds the donation pool and UMIS engine source code plus their compiled TEAL outputs.
- `backend/` hosts the Express proxy that serves the dashboard and relays signed transactions.
- `frontend/` contains the hero-style dashboard UI that connects to multiple Algorand wallets and orchestrates UMIS flows.
- `scripts/` gathers helpers for compiling contracts, simulating payouts, and managing deployments.

## Contracts overview
- **Donation pool** accepts grouped ALGO contributions, tracks each donor, enforces a minimum donation, and lets the owner withdraw accumulated ALGO via inner transactions.
- **UMIS engine** lets accounts opt in with a weight, ensures every payout recipient is opted in, computes proportional shares using `share_for_weight`, routes funds via inner transfers, and allows the owner to withdraw tiny remainders.

## Getting started
1. **Python**: Create and activate a virtual environment (`python -m venv .venv`), then install the Python dependencies with `pip install -r requirements.txt`.
2. **Contracts**: Run `python scripts/compile.py` to regenerate each `*_approval.teal` and `*_clear.teal`. Use `scripts/simulate.py --dry-run` to preview the payout flow without broadcasting.
3. **Deploy** (optional): Add `DEPLOYER_MNEMONIC` to `backend/.env` alongside `ALGOD_ADDRESS`/`ALGOD_TOKEN` and run `python scripts/deploy.py` to create the Algorand apps (note: the script expects `DEPLOYER_ADDRESS` in the same `.env`).
4. **Backend**: Populate `.env` with `ALGOD_ADDRESS`, `ALGOD_TOKEN`, and run `uvicorn backend.app:app --reload --host 127.0.0.1 --port 3000` to serve the dashboard, unsigned tx endpoints (`/api/unsigned/*`), and the broadcast proxy (`/api/broadcast`). The dashboard also polls `/api/config` to learn the active Algod endpoint, token, and network ID so the wallet connectors stay synchronized with the backend.
4. **Frontend**: Navigate to `http://127.0.0.1:3000`, connect a wallet, and interact with the UMIS/donation workflow.

## Recommended workflow
1. Modify a contract or dashboard component.
2. Recompile contracts and run the simulation helper to validate transaction flows.
3. Stage the relevant files and commit with a descriptive message.
4. Push to GitHub and tag the work if it corresponds to a release milestone.

## Backend API
- `GET /api/config`: returns the current `app_id`, Algod node URL/token, and the configured `genesis_id`/`genesis_hash` so the dashboard can display the active network.
- `POST /api/unsigned/media/register`: returns a base64 unsigned `register` application call (expects `app_id`, `sender`, `media_hash`, `metadata`, optional `nonce`).
- `POST /api/unsigned/media/verify`: returns a base64 unsigned `verify` call (expects `app_id`, `sender`, `content_hash`, `ipfs_cid`).
- `POST /api/broadcast`: accepts signed transaction blobs (`signed: string[]`) and forwards them to Algod.

## Next goals
- Add runtime guards and clearer documentation to `contracts/umis_engine.py`.
- Expand the simulation helper to support reusable recipient sets.
- Introduce a CI workflow that verifies contract compilation and lints the frontend assets.

