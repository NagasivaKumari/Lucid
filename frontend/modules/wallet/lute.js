import { importModule } from './utils.js';
import { getConfig } from '../core/config.js';

export async function connectLute(onConnect) {
    const config = getConfig();
    try {
        const mod = await importModule('/modules/lute-connect/main.esm.js');
        const LuteConnect = mod.default || mod.LuteConnect || mod;
        const lute = new LuteConnect(document.title);
        const accounts = await lute.connect(config.genesis_id);
        if (accounts && accounts.length) {
            onConnect('lute', accounts[0], lute);
        }
    } catch (err) {
        console.warn('lute-connect import or connect failed', err);
        alert('Lute connect failed: ' + err.message);
    }
}
