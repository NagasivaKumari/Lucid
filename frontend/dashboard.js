import { loadConfig } from './modules/core/config.js';
import { renderStatCards, updateStats } from './modules/ui/stats.js';
import { refreshTimeline } from './modules/ui/timeline.js';
import { createWalletButton, updateStatusTag, showAddress } from './modules/ui/wallet-ui.js';
import { connectPera } from './modules/wallet/pera.js';
import { connectAlgoSigner } from './modules/wallet/algosigner.js';
import { connectMyAlgo } from './modules/wallet/myalgo.js';
import { connectLute } from './modules/wallet/lute.js';
import { connectWalletConnect } from './modules/wallet/walletconnect.js';
import { getAlgodParams, sendSignedTxns } from './modules/api/client.js';

let connectedWallet = null;
let connectedAccount = null;
let activeWalletInstance = null; // Store instance for signing

// Callback for wallet connections
function onWalletConnected(walletName, account, instance) {
    connectedWallet = walletName;
    connectedAccount = account;
    activeWalletInstance = instance;
    showAddress(account);
    updateStatusTag(account);
    console.log(`Connected to ${walletName}:`, account);
}

// Initialize
(async () => {
    await loadConfig();

    // Initial UI render
    renderStatCards();
    refreshTimeline();
    updateStats();
    updateStatusTag(null);

    // Periodic updates
    setInterval(updateStats, 12000);
    setInterval(refreshTimeline, 18000);

    // Setup Wallet Buttons
    const connectPeraBtn = document.getElementById('connect-pera');
    if (connectPeraBtn) {
        connectPeraBtn.addEventListener('click', () => connectPera(onWalletConnected));
    }

    const connectWCBtn = document.getElementById('connect-walletconnect');
    if (connectWCBtn) {
        connectWCBtn.addEventListener('click', () => connectWalletConnect(onWalletConnected));
    }

    // Create secondary buttons
    createWalletButton('Connect AlgoSigner', () => connectAlgoSigner(onWalletConnected), ['secondary']);
    createWalletButton('Connect MyAlgo', () => connectMyAlgo(onWalletConnected), ['secondary']);
    createWalletButton('Connect Lute', () => connectLute(onWalletConnected), ['secondary']);

    // Setup Action Buttons
    setupActionButtons();
})();


function setupActionButtons() {
    const optInBtn = document.getElementById('opt-in');
    const setWeightBtn = document.getElementById('set-weight');
    const distributeBtn = document.getElementById('distribute');
    const appIdInput = document.getElementById('app-id');
    const weightInput = document.getElementById('weight-value');

    async function importAlgosdk() {
        const mod = await import('/modules/algosdk/esm/index.js');
        return mod.default || mod;
    }

    async function signAndSendWrapper(txns, purpose) {
        if (!activeWalletInstance || !connectedWallet) {
            alert('No wallet connected for signing.');
            return;
        }

        const txnBlobs = txns.map(t => t.toByte());

        try {
            let signedBlobs = [];

            if (connectedWallet === 'pera') {
                const signed = await activeWalletInstance.signTransaction([txnBlobs[0].toString('base64')].concat(txnBlobs.slice(1).map(b => b.toString('base64'))));
                signedBlobs = signed.map(s => Buffer.from(s, 'base64'));
            } else if (connectedWallet === 'myalgo') {
                const signed = await activeWalletInstance.signTransactions(txns.map(txn => ({ txn: txn.toByte() })));
                signedBlobs = signed.map(s => s.blob);
            } else if (connectedWallet === 'algosigner') {
                const params = await Promise.all(txns.map(t => ({ txn: Buffer.from(t.toByte()).toString('base64') })));
                const signed = await activeWalletInstance.signTxn(params);
                signedBlobs = signed.map(s => Buffer.from(s.blob, 'base64'));
            } else if (connectedWallet === 'walletconnect') {
                const txnsBase64 = txns.map(t => Buffer.from(t.toByte()).toString('base64'));
                const res = await activeWalletInstance.sendCustomRequest({ method: 'algo_signTxn', params: [txnsBase64] });
                signedBlobs = res.map(s => (s ? Buffer.from(s, 'base64') : null)).filter(Boolean);
            } else if (connectedWallet === 'lute') {
                alert('Lute signing pending implementation');
                return;
            }

            await sendSignedTxns(signedBlobs);
            alert(`${purpose} successful!`);

        } catch (err) {
            console.error('Signing failed', err);
            alert(`Signing failed: ${err.message}`);
        }
    }

    if (optInBtn) {
        optInBtn.addEventListener('click', async () => {
            const appId = Number(appIdInput.value || 0);
            if (!appId || !connectedAccount) return alert('Invalid App ID or not connected');

            const algosdk = await importAlgosdk();
            const params = await getAlgodParams();
            const txn = algosdk.makeApplicationOptInTxn(connectedAccount, params, appId);
            await signAndSendWrapper([txn], 'Opt-in');
        });
    }

    if (setWeightBtn) {
        setWeightBtn.addEventListener('click', async () => {
            const appId = Number(appIdInput.value || 0);
            const weight = Number(weightInput.value || 1);
            if (!appId || !connectedAccount) return alert('Invalid inputs');

            const algosdk = await importAlgosdk();
            const params = await getAlgodParams();
            const appArgs = [new Uint8Array(Buffer.from('set_weight')), algosdk.encodeUint64(weight)];
            const txn = algosdk.makeApplicationNoOpTxn(connectedAccount, params, appId, appArgs);
            await signAndSendWrapper([txn], 'Set Weight');
        });
    }

    if (distributeBtn) {
        distributeBtn.addEventListener('click', async () => {
            const appId = Number(appIdInput.value || 0);
            if (!appId || !connectedAccount) return alert('Invalid App ID');

            const raw = prompt('Enter recipient addresses (comma-separated)');
            if (!raw) return;
            const recipients = raw.split(',').map((s) => s.trim()).filter(Boolean);

            const amountStr = prompt('Total amount in microAlgos');
            const totalAmount = Number(amountStr || 0);
            if (totalAmount <= 0) return alert('Invalid amount');

            const algosdk = await importAlgosdk();
            const params = await getAlgodParams();
            const appAddress = algosdk.getApplicationAddress(appId);

            const payTxn = algosdk.makePaymentTxnWithSuggestedParams(connectedAccount, appAddress, totalAmount, undefined, undefined, params);
            const appCall = algosdk.makeApplicationNoOpTxn(connectedAccount, params, appId, [new Uint8Array(Buffer.from('distribute'))], recipients);

            const groupId = algosdk.computeGroupID([payTxn, appCall]);
            payTxn.group = groupId;
            appCall.group = groupId;

            await signAndSendWrapper([payTxn, appCall], 'Distribute');
        });
    }
}
