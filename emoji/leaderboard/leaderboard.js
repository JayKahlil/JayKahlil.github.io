const leaderboardTable = document.getElementById('leaderboard').getElementsByTagName('tbody')[0];

function renderLeaderboard(data) {
    // Sort by picked, highest first
    data.forEach(item => {
        item.picked = typeof item.picked === 'number' ? item.picked : 0;
        item.shown = typeof item.shown === 'number' ? item.shown : 0;
        item.pickPercent = item.shown > 0 ? (item.picked / item.shown) * 100 : 0;
    });
    data.sort((a, b) => b.picked - a.picked || b.pickPercent - a.pickPercent);
    let rows = [];
    let lastPicked = null;
    let lastPickPercent = null;
    let rank = 1;
    let skip = 0;
    data.forEach((item, i) => {
        if (lastPicked === null || item.picked !== lastPicked || item.pickPercent !== lastPickPercent) {
            rank = i + 1;
            skip = 0;
        } else {
            skip++;
        }
        rows.push(`
            <tr>
                <td class="rank">${rank}</td>
                <td class="leaderboard-emoji">${item.emoji}</td>
                <td>${item.picked}</td>
                <td>${item.shown}</td>
                <td>${item.shown > 0 ? item.pickPercent.toFixed(1) + '%' : '—'}</td>
            </tr>
        `);
        lastPicked = item.picked;
        lastPickPercent = item.pickPercent;
    });
    leaderboardTable.innerHTML = rows.join('') || '<tr><td colspan="5" class="loading">No data found.</td></tr>';
}

fetch('https://zqdbog6asg.execute-api.eu-west-1.amazonaws.com/things/emoji-rankings?action=get_all')
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data['rankings']) && data['rankings'].length > 0) {
            renderLeaderboard(data['rankings']);
        } else {
            leaderboardTable.innerHTML = '<tr><td colspan="5" class="loading">No data found.</td></tr>';
        }
    })
    .catch(() => {
        leaderboardTable.innerHTML = '<tr><td colspan="5" class="loading">Error loading leaderboard.</td></tr>';
    });
