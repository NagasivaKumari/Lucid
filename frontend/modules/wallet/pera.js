/**
 * Module: pera.js
 * Description: Frontend module for pera.js.
 */

import { importModule } from './utils.js';

export async function connectPera(onConnect) {
    try {
        const mod = await importModule('https://esm.sh/@perawallet/connect@1.5.2');
        const PeraConnect = mod.default || mod.PeraConnect || mod;
        const peraWallet = new PeraConnect({ shouldShowSignTxnToast: true });
        const accounts = await peraWallet.connect();
        if (accounts && accounts.length) {
            onConnect('pera', accounts[0], peraWallet);
        }
    } catch (err) {
        alert('Pera connect failed. Make sure the Pera Wallet extension or mobile app is available.');
    }
}
