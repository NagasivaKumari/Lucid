/**
 * Module: wallet-ui.js
 * Description: Frontend module for wallet-ui.js.
 */

const walletContainer = document.getElementById('wallet');
const statusTag = document.getElementById('status-tag');
const walletAddress = document.getElementById('wallet-address');

export function createWalletButton(text, callback, classes = []) {
    if (!walletContainer) return;
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.classList.add(...classes);
    btn.addEventListener('click', callback);
    walletContainer.appendChild(btn);
    return btn;
}

export function updateStatusTag(connectedAccount) {
    if (!statusTag) return;
    if (connectedAccount) {
        statusTag.textContent = 'Bridge Online';
        statusTag.style.color = '#2dd4bf';
    } else {
        statusTag.textContent = 'Bridge Offline';
        statusTag.style.color = '#7c5dff';
    }
}

export function showAddress(address) {
    if (!walletAddress) return;
    walletAddress.textContent = address ? `Connected • ${address}` : 'Not connected';
}
