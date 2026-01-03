const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '5mb' }));

const ALGOD_ADDRESS = process.env.ALGOD_ADDRESS || 'https://testnet-algorand.api.purestake.io/ps2';
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '<PURESTAKE_API_KEY>';
const ALGOD_HEADERS = { 'X-API-Key': ALGOD_TOKEN };

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// Endpoint to broadcast signed txns (array of base64 blobs)
app.post('/api/send-signed', async (req, res) => {
  try {
    const { signed } = req.body; // array of base64 strings
    if (!signed || !Array.isArray(signed) || signed.length === 0) {
      return res.status(400).json({ error: 'no signed txns' });
    }

    // Post all signed txns as raw binary to algod /v2/transactions
    // For multiple txns, send in single POST with concatenated blobs per algod spec
    const concatenated = Buffer.concat(signed.map(s => Buffer.from(s, 'base64')));

    const resp = await fetch(`${ALGOD_ADDRESS}/v2/transactions`, {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/x-binary' }, ALGOD_HEADERS),
      body: concatenated,
    });

    const body = await resp.text();
    if (!resp.ok) {
      return res.status(resp.status).send(body);
    }

    return res.status(200).send(body);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
