/**
 * Module: config.js
 * Description: Frontend module for config.js.
 */

let config = null;

export async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        config = await res.json();
        console.log('Config loaded:', config);
        return config;
    } catch (err) {
        console.error('Failed to load config:', err);
        alert('Failed to load application configuration. Backend might be down.');
        throw err;
    }
}

export function getConfig() {
    if (!config) {
        throw new Error('Config not loaded yet');
    }
    return config;
}
