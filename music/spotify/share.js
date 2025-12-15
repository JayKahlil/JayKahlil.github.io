import { getDataForYear, ms_to_time } from './year-stats.js';

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

const accentColour = '#1DB954';
const mutedColour = '#9fcaa3';
const track_key = 'master_metadata_track_name';
const artist_key = 'master_metadata_album_artist_name';

function drawTopList(ctx, title, list, x, y, cardWidth, scale = 1) {
    ctx.fillStyle = mutedColour;
    ctx.font = `bold ${13 * scale}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(title, x, y);

    const rowOuterHeight = 32 * scale;
    const rowPadding = { left: 10 * scale, right: 10 * scale };

    list.forEach((item, index) => {
        const boxY = y + (15 * scale) + (index * rowOuterHeight);
        const boxHeight = rowOuterHeight - (4 * scale);

        // Draw the background box for the row
        const rowGradient = ctx.createLinearGradient(0, boxY, 0, boxY + boxHeight);
        rowGradient.addColorStop(0, 'rgba(255,255,255,0.02)');
        rowGradient.addColorStop(1, 'rgba(0,0,0,0.04)');
        ctx.fillStyle = rowGradient;

        drawRoundedRect(ctx, x, boxY, cardWidth, boxHeight, 8 * scale);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        const textY = boxY + boxHeight / 2 + (5 * scale);
        const textX = x + rowPadding.left;
        let text;

        switch(title) {
            case 'Top Tracks':
                text = `${index + 1}. ${item[1]['track']}`;
                if (item[1]['artist']) {
                    text += ` - ${item[1]['artist']}`;
                }
                break;
            case 'Top Artists':
                text = `${index + 1}. ${item[0]}`;
                break;
            case 'Top Albums':
                text = `${index + 1}. ${item[1]['album']}`;
                if (item[1]['artist']) {
                    text += ` - ${item[1]['artist']}`;
                }
                break;
            case 'Top Podcasts':
                text = `${index + 1}. ${item[0]}`;
                break;
        }
        
        ctx.font = `${12 * scale}px Arial`;
        let playsText, timeText, playsColor, timeColor;

        switch (title) {
            case 'Top Tracks':
            case 'Top Artists':
                playsText = `${item[1]['plays']} plays`;
                timeText = ms_to_time(item[1]['ms']);
                playsColor = accentColour;
                timeColor = mutedColour;
                break;
            case 'Top Albums':
                playsText = `${item[1]['plays']} track plays`;
                timeText = ms_to_time(item[1]['ms']);
                playsColor = accentColour;
                timeColor = mutedColour;
                break;
            case 'Top Podcasts':
                playsText = `${item[1]['plays']} plays, ${item[1]['unique_episodes'].size} eps`;
                timeText = ms_to_time(item[1]['ms']);
                playsColor = mutedColour;
                timeColor = accentColour;
                break;
        }
        
        ctx.font = `600 ${12 * scale}px Arial`;
        const timeWidth = ctx.measureText(timeText).width;
        const playsWidth = ctx.measureText(playsText).width;

        ctx.font = `${12 * scale}px Arial`;
        const maxTextWidth = cardWidth - timeWidth - playsWidth - rowPadding.left - rowPadding.right - (20 * scale);

        let truncatedText = text;
        if (ctx.measureText(text).width > maxTextWidth) {
            while (ctx.measureText(truncatedText + '...').width > maxTextWidth) {
                truncatedText = truncatedText.slice(0, -1);
            }
            truncatedText += '...';
        }
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(truncatedText, textX, textY);

        // Draw stats
        const rightEdge = x + cardWidth - rowPadding.right;
        ctx.font = `600 ${12 * scale}px Arial`;
        ctx.textAlign = 'right';

        ctx.fillStyle = timeColor;
        ctx.fillText(timeText, rightEdge, textY);

        ctx.fillStyle = playsColor;
        ctx.fillText(playsText, rightEdge - timeWidth - (10 * scale), textY);
    });
}

export function generateImageForYear(plays, podcast_plays, year) {
    const {
        unique_tracks,
        unique_artists,
        unique_albums,
        unique_podcasts,
        unique_podcast_episodes,
        top_tracks,
        top_artists,
        top_albums,
        top_podcasts,
        play_time,
        play_time_minutes,
        podcast_play_time,
        podcast_play_time_minutes,
        plays_by_date
    } = getDataForYear(plays, podcast_plays, 5);

    const first_play = new Date(plays_by_date[0][1].ts);
    const last_play = new Date(plays_by_date[plays_by_date.length - 1][1].ts);

    return new Promise((resolve, reject) => {
        const scale = 2;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        const width = 800 * scale;
        const height = 1175 * scale;
        canvas.width = width;
        canvas.height = height;

        // Background
        let gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#031612');
        gradient.addColorStop(1, '#07251b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Inner card
        ctx.strokeStyle = 'rgba(29, 185, 84, 0.08)';
        ctx.lineWidth = 4 * scale;
        ctx.shadowColor = 'rgba(3, 10, 6, 0.6)';
        ctx.shadowBlur = 10 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10 * scale;
        const cardX = 25 * scale;
        const cardY = 25 * scale;
        const cardWidth = width - (50 * scale);
        const cardHeight = height - (50 * scale);
        const borderRadius = 10 * scale;

        const cardGradient = ctx.createLinearGradient(0, cardY, 0, cardY + cardHeight);
        cardGradient.addColorStop(0, 'rgba(12,38,24,0.9)');
        cardGradient.addColorStop(1, 'rgba(4,20,16,0.9)');
        ctx.fillStyle = cardGradient;

        drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // Left border only
        ctx.beginPath();
        ctx.moveTo(cardX + borderRadius, cardY);
        ctx.arcTo(cardX, cardY, cardX, cardY + borderRadius, borderRadius);
        ctx.lineTo(cardX, cardY + cardHeight - borderRadius);
        ctx.arcTo(cardX, cardY + cardHeight, cardX + borderRadius, cardY + cardHeight, borderRadius);
        ctx.stroke();

        // Title
        ctx.fillStyle = accentColour;
        ctx.font = `bold ${30 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`Spotify Summary for ${year === 0 ? 'All Time' : year}`, width / 2, 90 * scale);

        // Stats Section
        ctx.textAlign = 'left';

        const statY = 130 * scale;
        const statX = cardX + (25 * scale);
        const lineHeight = 22 * scale;

        function drawStatLine(x, y, label, value, truncate = false) {
            ctx.font = `600 ${14 * scale}px Arial`;
            ctx.fillStyle = accentColour;
            ctx.fillText(label, x, y);
            
            const labelWidth = ctx.measureText(label).width;
            const valueX = x + labelWidth;
            
            ctx.font = `${14 * scale}px Arial`;
            ctx.fillStyle = mutedColour;

            let valueToDraw = value;
            if (truncate) {
                const maxValWidth = (cardX + cardWidth) - valueX - (20 * scale);
                if (ctx.measureText(String(value)).width > maxValWidth) {
                    let truncated = String(value);
                    while (ctx.measureText(truncated + '...').width > maxValWidth) {
                        truncated = truncated.slice(0, -1);
                    }
                    valueToDraw = truncated + '...';
                }
            }
            ctx.fillText(valueToDraw, valueX, y);
        }

        let currentY = statY;
        drawStatLine(statX, currentY, 'Song Plays: ', plays.length);
        currentY += lineHeight;
        drawStatLine(statX, currentY, 'Listening Time: ', `${play_time} (${Math.round(play_time_minutes)} mins)`);
        currentY += lineHeight;
        drawStatLine(statX, currentY, 'Tracks: ', Object.keys(unique_tracks).length);
        currentY += lineHeight;
        drawStatLine(statX, currentY, 'Artists: ', Object.keys(unique_artists).length);
        currentY += lineHeight;
        drawStatLine(statX, currentY, 'Albums: ', Object.keys(unique_albums).length);
        currentY += lineHeight;
        
        const firstSongText = `${plays_by_date[0][1][track_key]} - ${plays_by_date[0][1][artist_key]} ${first_play.toLocaleDateString()}`;
        drawStatLine(statX, currentY, 'First Song: ', firstSongText, true);
        currentY += lineHeight;

        const lastSongText = `${plays_by_date[plays_by_date.length - 1][1][track_key]} - ${plays_by_date[plays_by_date.length - 1][1][artist_key]} ${last_play.toLocaleDateString()}`;
        drawStatLine(statX, currentY, 'Last Song: ', lastSongText, true);
        currentY += lineHeight;

        drawStatLine(statX, currentY, 'Podcast Listening Time: ', `${podcast_play_time} (${Math.round(podcast_play_time_minutes)} mins)`);
        currentY += lineHeight;
        drawStatLine(statX, currentY, 'Podcasts: ', Object.keys(unique_podcasts).length);
        currentY += lineHeight;
        drawStatLine(statX, currentY, 'Episodes: ', Object.keys(unique_podcast_episodes).length);
        currentY += lineHeight;

        // Horizontal line separator
        const lineY = currentY + (10 * scale);
        ctx.strokeStyle = mutedColour;
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(cardX + (20 * scale), lineY);
        ctx.lineTo(cardX + cardWidth - (20 * scale), lineY);
        ctx.stroke();


        // Top Lists
        const listStartY = lineY + (20 * scale);
        const listSectionHeight = 190 * scale;
        const listX = cardX + (20 * scale);
        const listWidth = cardWidth - (40 * scale);

        drawTopList(ctx, 'Top Tracks', top_tracks, listX, listStartY, listWidth, scale);
        drawTopList(ctx, 'Top Artists', top_artists, listX, listStartY + listSectionHeight, listWidth, scale);
        drawTopList(ctx, 'Top Albums', top_albums, listX, listStartY + listSectionHeight * 2, listWidth, scale);
        drawTopList(ctx, 'Top Podcasts', top_podcasts, listX, listStartY + listSectionHeight * 3, listWidth, scale);


        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                resolve(url);
            } else {
                reject(new Error('Failed to create blob.'));
            }
        }, 'image/png');
    });
}