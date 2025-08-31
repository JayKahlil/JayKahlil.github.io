import { EMOJIS } from '../constants.js';

const CLOCKS = [
    "🕛", "🕧",
    "🕐", "🕜",
    "🕑", "🕝",
    "🕒", "🕞",
    "🕓", "🕟",
    "🕔", "🕠",
    "🕕", "🕡",
    "🕖", "🕢",
    "🕗", "🕣",
    "🕘", "🕤",
    "🕙", "🕥",
    "🕚", "🕦"
]

const TOP_TEN = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

// Usage: drawClockSegments([number, number, ..., number])
// Each number is the fill value for a segment (0 = empty, max = full)

function drawClockSegments(values) {
    const canvas = document.getElementById('clock-canvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const rMax = Math.min(w, h) / 2 - 40;
    const rMin = 24;
    const n = 24;
    const maxVal = Math.max(...values, 1);
    const angleStep = (2 * Math.PI) / n;
    for (let i = 0; i < n; i++) {
        const val = Math.max(0, values[i] || 0);
        const fill = val / maxVal;
        const rFill = rMin + fill * (rMax - rMin);
        const start = -Math.PI / 2 + i * angleStep;
        const end = start + angleStep;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, rFill, start, end, false);
        ctx.closePath();
        ctx.fillStyle = fill === 0 ? '#eee' : `hsl(${i * 15}, 80%, ${60 + 30 * fill}%)`;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    // Draw clock outline
    ctx.beginPath();
    ctx.arc(cx, cy, rMax, 0, 2 * Math.PI);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Draw clock emojis around the clock
    ctx.font = `${Math.floor(rMax * 0.14)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (i + 0.5) * angleStep;
        // Increase the radius for emoji placement
        const emojiR = rMax + Math.floor(rMax * 0.14); // increased for more space
        const ex = cx + Math.cos(angle) * emojiR;
        const ey = cy + Math.sin(angle) * emojiR;
        ctx.save();
        ctx.shadowColor = '#fffbe6';
        ctx.shadowBlur = 8;
        ctx.fillText(CLOCKS[i], ex, ey + 3);
        ctx.restore();
    }
}

function getClockStats(rankings) {
    // Process data to get fill values for each clock segment
    const values = Array(24).fill(0);
    rankings.forEach(item => {
        const index = CLOCKS.indexOf(item.emoji);
        if (index !== -1) {
            values[index] = item.picked || 0;
        }
    });
    return values;
}


const generalStatsTable = document.getElementById('general-stats').getElementsByTagName('tbody')[0];

function renderGeneralStats(data) {
    const totalPicked = data.reduce((sum, item) => sum + (typeof item.picked === 'number' ? item.picked : 0), 0);
    const uniqueEmojis = data.length;
    const totalEmojis = EMOJIS.length;
    const percent = Math.round((uniqueEmojis / totalEmojis) * 100);
    let rows = [];
    rows.push(`
        <tr>
            <td>Choices Made</td>
            <td>${totalPicked}</td>
        </tr>
    `);
    rows.push(`
        <tr>
            <td>Unique Emojis Shown</td>
            <td style="position:relative; min-width:120px;">
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width:${percent}%;"></div>
                    <span class="progress-bar-label">${uniqueEmojis} / ${totalEmojis}</span>
                </div>
            </td>
        </tr>
    `);
    generalStatsTable.innerHTML = rows.join('') || '<tr><td colspan="2" class="loading">No data found.</td></tr>';
}

const topTenTable = document.getElementById('top-ten-numbers').getElementsByTagName('tbody')[0];

function renderTopTenNumbers(data) {
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
    topTenTable.innerHTML = rows.join('') || '<tr><td colspan="5" class="loading">No data found.</td></tr>';
}


fetch('https://zqdbog6asg.execute-api.eu-west-1.amazonaws.com/things/emoji-rankings?action=get_all')
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data['rankings']) && data['rankings'].length > 0) {
            renderGeneralStats(data['rankings']);
            const clockStats = getClockStats(data['rankings']);
            drawClockSegments(clockStats);
            renderTopTenNumbers(data['rankings'].filter(item => TOP_TEN.includes(item.emoji)));
        }
     });
