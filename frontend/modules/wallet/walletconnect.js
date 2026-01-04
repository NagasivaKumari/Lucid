/**
 * Module: walletconnect.js
 * Description: Frontend module for walletconnect.js.
 */

import { importModule } from './utils.js';

export async function connectWalletConnect(onConnect) {
    try {
        const WC = await importModule('/modules/walletconnect-client/index.js');
        const WalletConnect = WC.default || WC;

        await importModule('/modules/walletconnect-qrcode-modal/index.min.js');
        const QRCodeModal = window.WalletConnectQRCodeModal;

        if (!QRCodeModal) {
            throw new Error('WalletConnectQRCodeModal not found on window');
        }

        const walletConnector = new WalletConnect({
            bridge: 'https://bridge.walletconnect.org',
            qrcodeModal: QRCodeModal
        });

        if (!walletConnector.connected) {
            await walletConnector.createSession();
        }

        walletConnector.on('connect', (error, payload) => {
            if (error) throw error;
            const accounts = payload.params[0].accounts;
            onConnect('walletconnect', accounts[0], walletConnector);
        });

        walletConnector.on('disconnect', () => {
            // Handle disconnect if needed, usually managed by state in main app
        });

        return walletConnector;

    } catch (err) {
        console.error('WalletConnect init failed', err);
        alert('WalletConnect initialization failed: ' + err.message);
    }
}
