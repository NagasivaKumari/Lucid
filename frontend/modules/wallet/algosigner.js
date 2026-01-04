/**
 * Module: algosigner.js
 * Description: Frontend module for algosigner.js.
 */

export async function connectAlgoSigner(onConnect) {
    if (!window.AlgoSigner) {
        alert('AlgoSigner not found. Install the AlgoSigner extension.');
        return;
    }
    try {
        await window.AlgoSigner.connect();
        const accounts = await window.AlgoSigner.accounts({ ledger: 'TestNet' });
        if (accounts && accounts.length) {
            onConnect('algosigner', accounts[0].address, window.AlgoSigner);
        }
    } catch (err) {
        console.error(err);
        alert('AlgoSigner connect failed.');
    }
}
