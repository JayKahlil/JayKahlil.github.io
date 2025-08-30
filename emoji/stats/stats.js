const CLOCKS = [
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
    "🕚", "🕦",
    "🕛", "🕧"
]

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
    const rMax = Math.min(w, h) / 2 - 30;
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
    ctx.font = `${Math.floor(rMax * 0.18)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (i + 0.5) * angleStep;
        // Increase the radius for emoji placement
        const emojiR = rMax + Math.floor(rMax * 0.13); // was 0.13, now 0.28 for more space
        const ex = cx + Math.cos(angle) * emojiR;
        const ey = cy + Math.sin(angle) * emojiR;
        ctx.save();
        ctx.shadowColor = '#fffbe6';
        ctx.shadowBlur = 8;
        ctx.fillText(CLOCKS[i], ex, ey + 3);
        ctx.restore();
    }
}

function getClockStats() {
    // Fetch stats data from API and return processed values for clock segments
    return fetch('https://zqdbog6asg.execute-api.eu-west-1.amazonaws.com/things/emoji-rankings?action=get_all')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data['rankings']) && data['rankings'].length > 0) {
                // Process data to get fill values for each clock segment
                const values = Array(24).fill(0);
                data['rankings'].forEach(item => {
                    const index = CLOCKS.indexOf(item.emoji);
                    if (index !== -1) {
                        values[index] = item.picked || 0;
                    }
                });
                return values;
            } else {
                return Array(24).fill(0);
            }
        })
        .catch(() => Array(24).fill(0));
}

// Example usage:
document.addEventListener('DOMContentLoaded', () => {
    getClockStats().then(values => {
        drawClockSegments(values);
     });
});
