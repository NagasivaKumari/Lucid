/**
 * Module: myalgo.js
 * Description: Frontend module for myalgo.js.
 */

import { importModule } from './utils.js';

export async function connectMyAlgo(onConnect) {
    try {
        const mod = await importModule('https://esm.sh/myalgo-connect@1.9.0');
        const MyAlgoConnect = mod.default || mod.MyAlgoConnect || mod;
        const myAlgoWallet = new MyAlgoConnect();
        const accounts = await myAlgoWallet.connect();
        if (accounts && accounts.length) {
            onConnect('myalgo', accounts[0].address || accounts[0], myAlgoWallet);
        }
    } catch (err) {
        alert('MyAlgo connect failed. Please include MyAlgo extension or check network.');
    }
}
