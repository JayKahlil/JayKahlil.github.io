import { EMOJIS } from './constants.js';

const container = document.getElementById('emoji-container');

function getRandomEmojis() {
    let idx1 = Math.floor(Math.random() * EMOJIS.length);
    let idx2;
    do {
        idx2 = Math.floor(Math.random() * EMOJIS.length);
    } while (idx2 === idx1);
    return [EMOJIS[idx1], EMOJIS[idx2]];
}

function showEmojis(emoji1, emoji2) {
    container.innerHTML = '';
    [emoji1, emoji2].forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'emoji';
        span.textContent = emoji;
        span.onclick = () => pickEmoji(emoji1, emoji2, emoji);
        container.appendChild(span);
    });
}

function pickEmoji(emoji1, emoji2, picked) {
    container.innerHTML = '<span class="loading">Saving...</span>';
    fetch('https://zqdbog6asg.execute-api.eu-west-1.amazonaws.com/things/emoji-rank', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
        },
        body: JSON.stringify({ emoji1: emoji1, emoji2: emoji2, picked_emoji: picked, action: 'increment' })
    })
    .then(() => {
        setTimeout(() => {
            const [new1, new2] = getRandomEmojis();
            showEmojis(new1, new2);
        }, 500);
    })
    .catch(() => {
        container.innerHTML = '<span class="loading">Error saving. Try again.</span>';
        setTimeout(() => {
            showEmojis(emoji1, emoji2);
        }, 1200);
    });
}

// Initial load
const [emoji1, emoji2] = getRandomEmojis();
showEmojis(emoji1, emoji2);
