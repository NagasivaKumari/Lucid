import { getConfig } from '../core/config.js';

export async function getAlgodParams() {
    const config = getConfig();
    const params = await fetch(`${config.algod_url}/v2/transactions/params`, {
        headers: { 'X-API-Key': config.algod_token },
    });
    return params.json();
}

export async function sendSignedTxns(signedBlobs) {
    const config = getConfig();
    const headers = { 'X-API-Key': config.algod_token, 'Content-Type': 'application/x-binary' };
    for (const blob of signedBlobs) {
        if (!blob) continue;
        await fetch(`${config.algod_url}/v2/transactions`, { method: 'POST', headers, body: blob });
    }
}
