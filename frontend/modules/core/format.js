export function formatAlgo(amount) {
    return `${(amount / 1e6).toLocaleString(undefined, { minimumFractionDigits: 2 })} ALGO`;
}

export function formatDate(timestamp) {
    // Placeholder for future date formatting
    return new Date(timestamp).toLocaleDateString();
}
