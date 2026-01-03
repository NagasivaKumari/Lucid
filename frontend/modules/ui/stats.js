import { formatAlgo } from '../core/format.js';

const poolValue = document.getElementById('pool-value');
const participantCount = document.getElementById('participant-count');
const nextPayout = document.getElementById('next-payout');
const statsGrid = document.getElementById('stats-grid');

const STAT_CARDS = [
    { label: 'Total donations', value: '0 ALGO', id: 'stat-donations' },
    { label: 'Recurring payments', value: '0 / week', id: 'stat-recurring' },
    { label: 'Active recipients', value: '0 people', id: 'stat-recipients' },
    { label: 'Average weight', value: '1.00x', id: 'stat-weight' },
];

export function renderStatCards() {
    if (!statsGrid) return;
    statsGrid.innerHTML = '';
    STAT_CARDS.forEach(({ label, value, id }) => {
        const card = document.createElement('article');
        card.className = 'stat-chip';
        card.id = id;
        card.innerHTML = `<strong>${label}</strong><div class="large">${value}</div>`;
        statsGrid.appendChild(card);
    });
}

export function updateStats() {
    const stats = generateRuntimeStats();
    const elDonations = document.getElementById('stat-donations');
    if (elDonations) elDonations.querySelector('.large').textContent = formatAlgo(stats.totalDonations);

    const elRecurring = document.getElementById('stat-recurring');
    if (elRecurring) elRecurring.querySelector('.large').textContent = `${stats.recurringPayments} / week`;

    const elRecipients = document.getElementById('stat-recipients');
    if (elRecipients) elRecipients.querySelector('.large').textContent = `${stats.activeRecipients} people`;

    const elWeight = document.getElementById('stat-weight');
    if (elWeight) elWeight.querySelector('.large').textContent = `${stats.avgWeight.toFixed(2)}x`;

    if (poolValue) poolValue.textContent = formatAlgo(stats.totalDonations);
    if (participantCount) participantCount.textContent = `${stats.activeRecipients} opted in`;
    if (nextPayout) nextPayout.textContent = stats.timeToNext;
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
