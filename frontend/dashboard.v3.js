console.log("VERSION 3 - CORRECTED PATHS LOADED");
const statusTag = document.getElementById('status-tag');
const poolValue = document.getElementById('pool-value');
const participantCount = document.getElementById('participant-count');
const nextPayout = document.getElementById('next-payout');
const statsGrid = document.getElementById('stats-grid');
const timelineList = document.getElementById('timeline');
const walletContainer = document.getElementById('wallet');

let config = null;

const STAT_CARDS = [
  { label: 'Total donations', value: '0 ALGO', id: 'stat-donations' },
  { label: 'Recurring payments', value: '0 / week', id: 'stat-recurring' },
  { label: 'Active recipients', value: '0 people', id: 'stat-recipients' },
  { label: 'Average weight', value: '1.00x', id: 'stat-weight' },
];

const timelineSamples = [
  { text: 'New community partner added 250 recipients', time: '10m ago' },
  { text: 'Rerouted 50% to disaster-relief pool', time: '38m ago' },
  { text: 'DAO approved new contract upgrade', time: '2h ago' },
];

let connectedWallet = null;
let connectedAccount = null;
let peraWallet = null;
let walletConnector = null;

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    config = await res.json();
    console.log('Config loaded:', config);
  } catch (err) {
    console.error('Failed to load config:', err);
    alert('Failed to load application configuration. Backend might be down.');
  }
}

function renderStatCards() {
  statsGrid.innerHTML = '';
  STAT_CARDS.forEach(({ label, value, id }) => {
    const card = document.createElement('article');
    card.className = 'stat-chip';
    card.id = id;
    card.innerHTML = `<strong>${label}</strong><div class="large">${value}</div>`;
    statsGrid.appendChild(card);
  });
}

function refreshTimeline() {
  timelineList.innerHTML = '';
  timelineSamples.forEach((entry) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${entry.text}</strong><span>${entry.time}</span>`;
    timelineList.appendChild(li);
  });
}

function formatAlgo(amount) {
  return `${(amount / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2 })} ALGO`;
}

function updateStats() {
  const stats = generateRuntimeStats();
  document.getElementById('stat-donations').querySelector('.large').textContent = formatAlgo(stats.totalDonations);
  document.getElementById('stat-recurring').querySelector('.large').textContent = `${stats.recurringPayments} / week`;
  document.getElementById('stat-recipients').querySelector('.large').textContent = `${stats.activeRecipients} people`;
  document.getElementById('stat-weight').querySelector('.large').textContent = `${stats.avgWeight.toFixed(2)}x`;

  poolValue.textContent = formatAlgo(stats.totalDonations);
  participantCount.textContent = `${stats.activeRecipients} opted in`;
  nextPayout.textContent = stats.timeToNext;
}

function generateRuntimeStats() {
  const activeRecipients = 120 + Math.floor(Math.random() * 40);
  const recurringPayments = 5 + Math.floor(Math.random() * 3);
  return {
    totalDonations: 400000 + activeRecipients * 42 * 1000,
    recurringPayments,
    activeRecipients,
    avgWeight: 1 + Math.random() * 2,
    timeToNext: `${8 - Math.floor(activeRecipients / 25)}h ${30 + Math.floor(Math.random() * 30)}m`,
  };
}

function updateStatusTag() {
  if (connectedAccount) {
    statusTag.textContent = 'Bridge Online';
    statusTag.style.color = '#2dd4bf';
  } else {
    statusTag.textContent = 'Bridge Offline';
    statusTag.style.color = '#7c5dff';
  }
}

function createWalletButton(text, callback, classes = []) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.classList.add(...classes);
  btn.addEventListener('click', callback);
  walletContainer.appendChild(btn);
  return btn;
}

const connectPera = document.getElementById('connect-pera');
const connectWalletConnect = document.getElementById('connect-walletconnect');

if (connectWalletConnect) {
  connectWalletConnect.addEventListener('click', connectWalletConnectFlow);
}

// Initialize
(async () => {
  await loadConfig();
  renderStatCards();
  refreshTimeline();
  updateStats();
  updateStatusTag();
  setInterval(updateStats, 12000);
  setInterval(refreshTimeline, 18000);

  // Create secondary buttons after config is loaded
  createWalletButton('Connect AlgoSigner', connectAlgoSigner, ['secondary']);
  createWalletButton('Connect MyAlgo', connectMyAlgo, ['secondary']);
  createWalletButton('Connect Lute', connectLute, ['secondary']);
})();

async function importModule(pkg) {
  try {
    return await import(pkg);
  } catch (err) {
    console.error('Module import failed:', pkg, err);
    throw err;
  }
}

if (connectPera) {
  connectPera.addEventListener('click', async () => {
    try {
      const mod = await importModule('https://esm.sh/@perawallet/connect@1.5.2');
      const PeraConnect = mod.default || mod.PeraConnect || mod;
      peraWallet = new PeraConnect({ shouldShowSignTxnToast: true });
      const accounts = await peraWallet.connect();
      if (accounts && accounts.length) {
        connectedWallet = 'pera';
        connectedAccount = accounts[0];
        showAddress(connectedAccount);
        updateStatusTag();
      }
    } catch (err) {
      alert('Pera connect failed. Make sure the Pera Wallet extension or mobile app is available.');
    }
  });
}

function showAddress(address) {
  const addrDiv = document.getElementById('wallet-address');
  if (!addrDiv) return;
  addrDiv.textContent = address ? `Connected • ${address}` : 'Not connected';
}

async function connectAlgoSigner() {
  if (!window.AlgoSigner) {
    alert('AlgoSigner not found. Install the AlgoSigner extension.');
    return;
  }
  try {
    await window.AlgoSigner.connect();
    const accounts = await window.AlgoSigner.accounts({ ledger: 'TestNet' });
    if (accounts && accounts.length) {
      connectedWallet = 'algosigner';
      connectedAccount = accounts[0].address;
      showAddress(connectedAccount);
      updateStatusTag();
    }
  } catch (err) {
    console.error(err);
    alert('AlgoSigner connect failed.');
  }
}

async function connectMyAlgo() {
  try {
    const mod = await importModule('https://esm.sh/myalgo-connect@1.9.0');
    const MyAlgoConnect = mod.default || mod.MyAlgoConnect || mod;
    const myAlgoWallet = new MyAlgoConnect();
    const accounts = await myAlgoWallet.connect();
    if (accounts && accounts.length) {
      connectedWallet = 'myalgo';
      connectedAccount = accounts[0].address || accounts[0];
      showAddress(connectedAccount);
      updateStatusTag();
    }
  } catch (err) {
    alert('MyAlgo connect failed. Please include MyAlgo extension or check network.');
  }
}

async function connectLute() {
  if (!config) {
    alert('Config not loaded yet');
    return;
  }
  try {
    // USE LOCAL MODULE (Corrected)
    const mod = await importModule('/modules/lute-connect/main.esm.js');
    const LuteConnect = mod.default || mod.LuteConnect || mod;
    const lute = new LuteConnect(document.title);
    // PASS GENESIS ID
    const accounts = await lute.connect(config.genesis_id);
    if (accounts && accounts.length) {
      connectedWallet = 'lute';
      connectedAccount = accounts[0];
      showAddress(connectedAccount);
      updateStatusTag();
    }
  } catch (err) {
    console.warn('lute-connect import or connect failed', err);
    alert('Lute connect failed: ' + err.message);
  }
}

async function connectWalletConnectFlow() {
  try {
    // USE LOCAL MODULES (Corrected)
    const WC = await importModule('/modules/walletconnect-client/index.js');
    const WalletConnect = WC.default || WC;

    // Load UMD for QRCodeModal
    await importModule('/modules/walletconnect-qrcode-modal/index.min.js');
    const QRCodeModal = window.WalletConnectQRCodeModal;

    if (!QRCodeModal) {
      throw new Error('WalletConnectQRCodeModal not found on window');
    }

    walletConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal
    });

    if (!walletConnector.connected) {
      await walletConnector.createSession();
    }

    walletConnector.on('connect', (error, payload) => {
      if (error) throw error;
      const accounts = payload.params[0].accounts;
      connectedWallet = 'walletconnect';
      connectedAccount = accounts[0];
      showAddress(connectedAccount);
      updateStatusTag();
    });

    walletConnector.on('disconnect', () => {
      connectedWallet = null;
      connectedAccount = null;
      showAddress(null);
      updateStatusTag();
    });
  } catch (err) {
    console.error('WalletConnect init failed', err);
    alert('WalletConnect initialization failed: ' + err.message);
  }
}

const optInBtn = document.getElementById('opt-in');
const setWeightBtn = document.getElementById('set-weight');
const distributeBtn = document.getElementById('distribute');
const appIdInput = document.getElementById('app-id');
const weightInput = document.getElementById('weight-value');

async function getAlgodParams() {
  if (!config) return {};
  const params = await fetch(`${config.algod_url}/v2/transactions/params`, {
    headers: { 'X-API-Key': config.algod_token },
  });
  return params.json();
}

async function importAlgosdk() {
  // USE LOCAL MODULE (Corrected)
  const mod = await import('/modules/algosdk/esm/index.js');
  return mod.default || mod;
}

async function optInToApp() {
  const appId = Number(appIdInput.value || 0);
  if (!appId) return alert('Enter a valid App ID');
  if (!connectedAccount) return alert('Connect a wallet first');

  const algosdk = await importAlgosdk();
  const params = await getAlgodParams();
  const txn = algosdk.makeApplicationOptInTxn(connectedAccount, params, appId);

  await signAndSend([txn], 'opt-in');
}

async function setWeight() {
  const appId = Number(appIdInput.value || 0);
  const weight = Number(weightInput.value || 1);
  if (!appId) return alert('Enter a valid App ID');
  if (!connectedAccount) return alert('Connect a wallet first');

  const algosdk = await importAlgosdk();
  const params = await getAlgodParams();
  const sender = connectedAccount;
  const appArgs = [new Uint8Array(Buffer.from('set_weight')), algosdk.encodeUint64(weight)];
  const txn = algosdk.makeApplicationNoOpTxn(sender, params, appId, appArgs);

  await signAndSend([txn], 'set-weight');
}

async function distributeAction() {
  const appId = Number(appIdInput.value || 0);
  if (!appId) return alert('Enter a valid App ID');
  if (!connectedAccount) return alert('Connect a wallet first');

  const raw = prompt('Enter recipient addresses (comma-separated)');
  if (!raw) return;
  const recipients = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (!recipients.length) return alert('No recipients provided');

  const amountStr = prompt('Total amount in microAlgos to distribute (1000000 = 1 ALGO)');
  const totalAmount = Number(amountStr || 0);
  if (totalAmount <= 0) return alert('Invalid amount');

  const algosdk = await importAlgosdk();
  const params = await getAlgodParams();
  const sender = connectedAccount;
  const appAddress = algosdk.getApplicationAddress(appId);

  const payTxn = algosdk.makePaymentTxnWithSuggestedParams(sender, appAddress, totalAmount, undefined, undefined, params);
  const appCall = algosdk.makeApplicationNoOpTxn(sender, params, appId, [new Uint8Array(Buffer.from('distribute'))], recipients);

  const groupId = algosdk.computeGroupID([payTxn, appCall]);
  payTxn.group = groupId;
  appCall.group = groupId;

  await signAndSend([payTxn, appCall], 'distribute');
}

distributeBtn && distributeBtn.addEventListener('click', distributeAction);
optInBtn && optInBtn.addEventListener('click', optInToApp);
setWeightBtn && setWeightBtn.addEventListener('click', setWeight);

async function signAndSend(txns, purpose) {
  const txnBlobs = txns.map((txn) => txn.toByte());

  if (connectedWallet === 'pera' && peraWallet) {
    const signed = await peraWallet.signTransaction([txnBlobs[0].toString('base64')].concat(txnBlobs.slice(1).map((b) => b.toString('base64'))));
    await sendSignedTxns(signed.map((s) => Buffer.from(s, 'base64')));
    alert(`${purpose} sent via Pera`);
    return;
  }

  if (connectedWallet === 'myalgo') {
    const mod = await importModule('https://esm.sh/myalgo-connect@1.9.0');
    const MyAlgoConnect = mod.default || mod.MyAlgoConnect || mod;
    const wallet = new MyAlgoConnect();
    const signed = await wallet.signTransactions(txns.map((txn) => ({ txn: txn.toByte() })));
    await sendSignedTxns(signed.map((s) => s.blob));
    alert(`${purpose} sent via MyAlgo`);
    return;
  }

  if (connectedWallet === 'algosigner' && window.AlgoSigner) {
    const params = await Promise.all(txns.map((t) => ({ txn: Buffer.from(t.toByte()).toString('base64') })));
    const signed = await window.AlgoSigner.signTxn(params);
    await sendSignedTxns(signed.map((s) => Buffer.from(s.blob, 'base64')));
    alert(`${purpose} sent via AlgoSigner`);
    return;
  }

  if (connectedWallet === 'lute' && connectedAccount) {
    try {
      const mod = await importModule('/modules/lute-connect/main.esm.js');
      const LuteConnect = mod.default || mod.LuteConnect || mod;
      const lute = new LuteConnect(document.title);
      // Lute expects specific transaction structure or base64
      // The LuteConnect source shows signTxns takes WalletTransaction[]
      // But let's assume standard behavior for now given we are fixing connect first.
      // For now, alerting user that signing is next step to verify.
      alert('Lute signing integration pending full verification of Lute API. Check console.');
      return;
    } catch (err) {
      console.error(err);
    }
  }

  if (connectedWallet === 'walletconnect' && walletConnector) {
    try {
      const txnsBase64 = txns.map((t) => Buffer.from(t.toByte()).toString('base64'));
      const res = await walletConnector.sendCustomRequest({ method: 'algo_signTxn', params: [txnsBase64] });
      await sendSignedTxns(res.map((s) => (s ? Buffer.from(s, 'base64') : null)).filter(Boolean));
      alert(`${purpose} sent via WalletConnect`);
      return;
    } catch (err) {
      console.error('WalletConnect sign/send failed', err);
      alert('WalletConnect signing failed: ' + err.message);
      return;
    }
  }

  alert('Signing not implemented for this wallet or wallet not connected.');
}

async function sendSignedTxns(signedBlobs) {
  if (!config) return;
  const headers = { 'X-API-Key': config.algod_token, 'Content-Type': 'application/x-binary' };
  for (const blob of signedBlobs) {
    if (!blob) continue;
    await fetch(`${config.algod_url}/v2/transactions`, { method: 'POST', headers, body: blob });
  }
}
