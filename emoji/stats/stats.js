import { EMOJIS, COLOUR_MAP } from '../constants.js';

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

function getColourStats(data) {
    const colourCounts = {
        red: 0,
        orange: 0,
        yellow: 0,
        green: 0,
        blue: 0,
        purple: 0,
        brown: 0,
        black: 0,
        white: 0
    };
    data.filter(item => COLOUR_MAP.hasOwnProperty(item.emoji)).forEach(item => {
        const colour = COLOUR_MAP[item.emoji];
        colourCounts[colour] += item.picked || 0;
    });
    return colourCounts;
}

// Colour picked from part of the iOS emoji set
// const COLOUR_TO_RGB = {
//     "red": "rgb(195, 54, 36)",
//     "orange": "rgb(208, 127, 46)",
//     "yellow": "rgb(248, 216, 73)",
//     "green": "rgb(77, 170, 49)",
//     "blue": "rgb(30, 75, 189)",
//     "purple": "rgb(156, 50, 246)",
//     "brown": "rgb(106, 64, 32)",
//     "black": "black",
//     "white": "white"
// }

const COLOUR_TO_RGB = {
    "red": "rgba(209, 25, 25, 1)",
    "orange": "rgba(247, 146, 30, 1)",
    "yellow": "rgba(255, 229, 61, 1)",
    "green": "rgba(75, 208, 34, 1)",
    "blue": "rgba(30, 35, 189, 1)",
    "purple": "rgba(152, 42, 248, 1)",
    "brown": "rgb(106, 64, 32)",
    "black": "black",
    "white": "white"
}

function renderRainbow(colourCounts) {
    for (const [key, value] of Object.entries(colourCounts)) {
        const degress = (value / Math.max(...Object.values(colourCounts), 1)) * 180;
        document.getElementById('rainbow-' + key).style.background="conic-gradient(from 270deg, " + COLOUR_TO_RGB[key] + " " + degress + "deg, rgb(211, 211, 211) 0deg)";
        document.getElementById('rainbow-' + key).title = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value} picks`;
    };
}


fetch('https://zqdbog6asg.execute-api.eu-west-1.amazonaws.com/things/emoji-rankings?action=get_all')
    .then(res => res.json())
    .then(data => {
        if (Array.isArray(data['rankings']) && data['rankings'].length > 0) {
            renderGeneralStats(data['rankings']);
            const clockStats = getClockStats(data['rankings']);
            drawClockSegments(clockStats);
            renderTopTenNumbers(data['rankings'].filter(item => TOP_TEN.includes(item.emoji)));
            const colourStats = getColourStats(data['rankings']);
            renderRainbow(colourStats);
        }
     });
