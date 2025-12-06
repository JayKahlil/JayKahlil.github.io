const artist_key = 'master_metadata_album_artist_name';
const track_key = 'master_metadata_track_name';

let top_n = 5;
let previous_year = null;
let last_result = null;

// Read all plays from a directory handle (native picker) or an array/FileList of File objects (fallback)
async function get_all_plays(files) {
    const plays = [];
    const plays_by_year = {};
    const fileArray = Array.from(files || []);

    await Promise.all(fileArray.map(async (file) => {
        try {
            const text = await file.text();
            const current_file_plays = JSON.parse(text);
            current_file_plays.forEach(play => {
                if (play['spotify_track_uri']) {
                    plays.push(play);
                    const year = new Date(play['ts']).getFullYear();
                    if (!(year in plays_by_year)) {
                        plays_by_year[year] = [];
                    }
                    plays_by_year[year].push(play);
                }
            });
        } catch (err) {
            console.warn('Failed to read/parse', file.name || file, err);
        }
    }));

    return {plays, plays_by_year};
}

function ms_to_minutes(ms) {
    return ms / 1000 / 60;
}

function get_play_time(plays) {
    let ms = 0;

    plays.forEach(play => {
        ms += play.ms_played || 0;
    });

    return ms;
}

function get_unique_plays(plays, key) {
    const unique = {};

    plays.forEach(play => {
        const value = play[key];
        if (!(value in unique)) {
            unique[value] = {plays: 0, ms: 0, artist: play[artist_key], uri: play['spotify_track_uri']};
        }
        unique[value]['plays'] += 1;
        unique[value]['ms'] += play.ms_played || 0;
    });

    return unique;
}

function get_top_n_by_plays(stats, n) {
    const sorted_stats = Object.entries(stats).sort((a, b) => b[1]['plays'] - a[1]['plays']);

    return sorted_stats.slice(0, n);
}

function ms_to_time(ms) {
    const total_seconds = Math.floor(ms / 1000);
    const seconds_in_minute = 60;
    const seconds_in_hour = 3600;
    const seconds_in_day = 86400;
    const seconds_in_month = 2592000; // 30 days
    const seconds_in_year = 31536000; // 365 days

    let remaining = total_seconds;

    const years = Math.floor(remaining / seconds_in_year);
    remaining %= seconds_in_year;

    const months = Math.floor(remaining / seconds_in_month);
    remaining %= seconds_in_month;

    const days = Math.floor(remaining / seconds_in_day);
    remaining %= seconds_in_day;

    const hours = Math.floor(remaining / seconds_in_hour);
    remaining %= seconds_in_hour;

    const minutes = Math.floor(remaining / seconds_in_minute);
    const seconds = remaining % seconds_in_minute;

    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    if (parts.length === 0) return '0s';
    return parts.join(' ');
}

function render_stats(plays, year=0) {
    // unique artists
    // unique tracks
    // total play time
    // top artists (with plays and time)
    // top tracks (with plays and time)

    const unique_tracks = get_unique_plays(plays, track_key);
    const unique_artists = get_unique_plays(plays, artist_key);

    const top_tracks = get_top_n_by_plays(unique_tracks, top_n);
    const top_artists = get_top_n_by_plays(unique_artists, top_n);

    const play_time_ms = get_play_time(plays);
    const play_time_minutes = ms_to_minutes(play_time_ms);
    const play_time = ms_to_time(play_time_ms);

    let section = document.createElement('section');
    section.id = `panel-${year}`;
    section.className = 'panel';
    section.setAttribute('aria-labelledby', `tab-${year}`);
    section.setAttribute('role', 'tabpanel');
    section.setAttribute('aria-hidden', 'true');
    section.innerHTML = `
        <div class="card">
            <p class="small">Unique Tracks: ${Object.keys(unique_tracks).length}</p>
            <p class="small">Unique Artists: ${Object.keys(unique_artists).length}</p>
            <p class="small">Total Play Time: ${play_time} (${play_time_minutes.toFixed(0)} minutes)</p>
            <div class="top-n-row">
              <div id="top-tracks-${year}" class="top-n">
              </div>
              <div id="top-artists-${year}" class="top-n">
              </div>
            </div>
        </div>
    `;
    let topTracksDiv = section.querySelector(`#top-tracks-${year}`);;
    topTracksDiv.innerHTML = '<p class="small"><strong>Top Tracks:</strong></p>';
    top_tracks.forEach((item, index) => {
        topTracksDiv.innerHTML += `<p class="small" title="${item[1]['artist']}">${index + 1}. <a class="track-link" href="${item[1]['uri']}">▶ ${item[0]}</a> - <span class="plays">${item[1]['plays']} plays</span> - <span class="time">${ms_to_time(item[1]['ms'])}</span></p>`;
    });
    let topArtistsDiv = section.querySelector(`#top-artists-${year}`);
    topArtistsDiv.innerHTML = '<p class="small"><strong>Top Artists:</strong></p>';
    top_artists.forEach((item, index) => {
        topArtistsDiv.innerHTML += `<p class="small">${index + 1}. ${item[0]} - <span class="plays">${item[1]['plays']} plays</span> - <span class="time">${ms_to_time(item[1]['ms'])}</span></p>`;
    });

    let button = document.createElement('button');
    button.className = 'tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('aria-controls', `panel-${year}`);
    button.id = `tab-${year}`;

    if (year === 0) {
        document.getElementById('panel-upload').after(section);
        button.innerText = 'Overall';
        document.getElementById('tab-upload').after(button);
    } else {
        document.getElementById(`panel-${previous_year}`).after(section);
        button.innerText = `${year}`;
        document.getElementById(`tab-${previous_year}`).after(button);
    }

    set_tab_listeners();

    previous_year = year;
}

function render_from_result(result) {
    // Clear previous results
    const existingPanels = document.querySelectorAll('.panel');
    existingPanels.forEach(panel => {
        if (panel.id !== 'panel-upload' && panel.id !== 'panel-settings') {
            panel.remove();
        }
    });
    const tablist = document.querySelector('.tabs');
    const existingTabs = tablist.querySelectorAll('[id^="tab-"]');
    existingTabs.forEach(tab => {
        if (tab.id !== 'tab-upload' && tab.id !== 'tab-settings') {
            tab.remove();
        }
    });
    previous_year = null;

    // Render overall stats
    render_stats(result.plays, 0);

    // Render yearly stats
    const years = Object.keys(result.plays_by_year).sort();
    years.forEach(year => {
        render_stats(result.plays_by_year[year], year);
    });
}

async function load_history(files) {
    // Use await instead of then and keep the parsed result in memory so UI can re-render without re-reading files
    const result = await get_all_plays(files);
    last_result = result;
    render_from_result(result);
}

function set_tab_listeners() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');
    tabs.forEach(tab => tab.removeEventListener('click', () => {}));

    tabs.forEach(tab => tab.addEventListener('click', () => {
      tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
      panels.forEach(p => p.setAttribute('aria-hidden', 'true'));
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.setAttribute('aria-hidden', 'false');
    }));
}

// Wait for DOM to be ready before attaching event listeners so elements exist
document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.getElementById('upload');
    const jsonUpload = document.getElementById('json-upload');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (jsonUpload) jsonUpload.click();
        });
    }

    if (jsonUpload) {
        jsonUpload.addEventListener('change', (event) => {
            load_history(event.target.files);
        });
    }

    const topNInput = document.getElementById('top-n-select');
    if (topNInput) {
        topNInput.addEventListener('change', (event) => {
            const value = parseInt(event.target.value, 10);
            if (!isNaN(value) && value > 0) {
                top_n = value;
                // Re-render using the last loaded result if available, otherwise fall back to reloading from the file input
                if (last_result) {
                    render_from_result(last_result);
                } else if (jsonUpload && jsonUpload.files && jsonUpload.files.length > 0) {
                    load_history(jsonUpload.files);
                }
            }
        });
    }

    set_tab_listeners();
});
