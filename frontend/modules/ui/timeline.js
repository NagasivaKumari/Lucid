const timelineList = document.getElementById('timeline');

const timelineSamples = [
    { text: 'New community partner added 250 recipients', time: '10m ago' },
    { text: 'Rerouted 50% to disaster-relief pool', time: '38m ago' },
    { text: 'DAO approved new contract upgrade', time: '2h ago' },
];

export function refreshTimeline() {
    if (!timelineList) return;
    timelineList.innerHTML = '';
    timelineSamples.forEach((entry) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${entry.text}</strong><span>${entry.time}</span>`;
        timelineList.appendChild(li);
    });
}
