import { renderCalendarHeatmap, renderGlobeHeatmap, renderPlatformOverTime } from './plots.js';
import { renderClockChart } from './d3-charts.js';

const artist_key = 'master_metadata_album_artist_name';
const track_key = 'master_metadata_track_name';
const track_uri_key = 'spotify_track_uri';
const album_key = 'master_metadata_album_album_name';

let top_n = 5;
let previous_year = null;
let last_result = null;

const regionNamesInEnglish = new Intl.DisplayNames(["en"], { type: "region" });

// Read all plays from a directory handle (native picker) or an array/FileList of File objects (fallback)
async function get_all_plays(files) {
    const plays = [];
    const plays_by_year = {};
    const fileArray = Array.from(files || []);
    const skip_counts = {};
    let shuffle_count = 0;
    const countries = {};

    await Promise.all(fileArray.map(async (file) => {
        try {
            const text = await file.text();
            const current_file_plays = JSON.parse(text);
            current_file_plays.forEach(play => {
                if (play[track_uri_key]) {
                    try {
                        plays.push(play);
                        const year = new Date(play['ts']).getFullYear();
                        if (!(year in plays_by_year)) {
                            plays_by_year[year] = [];
                        }
                        plays_by_year[year].push(play);
                        
                        if (play['skipped']) {
                            let track_uri = play[track_uri_key];
                            if (!(track_uri in skip_counts)) {
                                skip_counts[track_uri] = {track: play[track_key], artist: play[artist_key], count: 0};
                            }
                            skip_counts[track_uri]['count'] += 1;
                        }

                        if (play['shuffle']) {
                            shuffle_count += 1;
                        }

                        let conn_country = play['conn_country'];
                        // Normalize missing country values and increment correctly
                        conn_country = conn_country || 'Unknown';
                        countries[conn_country] = (countries[conn_country] || 0) + 1;
                    } catch (err) {
                        console.warn('Failed to process play entry', play, err);
                    }
                }
            });
        } catch (err) {
            console.warn('Failed to read/parse', file.name || file, err);
        }
    }));

    return {plays, plays_by_year, skip_counts, shuffle_count, countries};
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

function get_unique_tracks(plays) {
    const unique = {};

    plays.forEach(play => {
        const value = play[track_uri_key];
        if (!(value in unique)) {
            unique[value] = {plays: 0, ms: 0, artist: play[artist_key], track: play[track_key]};
        }
        unique[value]['plays'] += 1;
        unique[value]['ms'] += play.ms_played || 0;
    });

    return unique;
}

function get_unique_artists(plays) {
    const unique = {};

    plays.forEach(play => {
        const value = play[artist_key];
        if (!(value in unique)) {
            unique[value] = {plays: 0, ms: 0};
        }
        unique[value]['plays'] += 1;
        unique[value]['ms'] += play.ms_played || 0;
    });

    return unique;
}

function get_unique_albums(plays) {
    const unique = {};

    plays.forEach(play => {
        const value = `${play[album_key]}-${play[artist_key]}`;
        if (!(value in unique)) {
            unique[value] = {plays: 0, ms: 0, artist: play[artist_key], album: play[album_key]};
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

    const unique_tracks = get_unique_tracks(plays);
    const unique_artists = get_unique_artists(plays);
    const unique_albums = get_unique_albums(plays);

    const top_tracks = get_top_n_by_plays(unique_tracks, top_n);
    const top_artists = get_top_n_by_plays(unique_artists, top_n);
    const top_albums = get_top_n_by_plays(unique_albums, top_n);

    const play_time_ms = get_play_time(plays);
    const play_time_minutes = ms_to_minutes(play_time_ms);
    const play_time = ms_to_time(play_time_ms);

    const plays_by_date = Object.entries(plays).sort((a, b) => new Date(a[1]['ts']) - new Date(b[1]['ts']));

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
            <p class="small">Total Plays: ${plays.length}</p>
            <p class="small">Total Play Time: ${play_time} (${play_time_minutes.toFixed(0)} minutes)</p>
            <div id="top-n-lists-${year}" class="top-n-row">
              <div id="top-tracks-${year}" class="top-n">
              </div>
              <div id="top-artists-${year}" class="top-n">
              </div>
              <div id="top-albums-${year}" class="top-n">
              </div>
            </div>
        </div>
    `;
    if (year !== 0) {
        let topNListsDiv = section.querySelector(`#top-n-lists-${year}`);

        let firstPlayP = document.createElement('p');
        firstPlayP.className = 'small';
        firstPlayP.innerHTML = `First Play: <a class="track-link" href="${plays_by_date[0][1][track_uri_key]}"><span class="play_icon">▶</span>${plays_by_date[0][1][track_key]} - ${plays_by_date[0][1][artist_key]}</a> - ${new Date(plays_by_date[0][1]['ts'])}`;
        topNListsDiv.before(firstPlayP);

        let lastPlayP = document.createElement('p');
        lastPlayP.className = 'small';
        lastPlayP.innerHTML = `Last Play: <a class="track-link" href="${plays_by_date[plays_by_date.length - 1][1][track_uri_key]}"><span class="play_icon">▶</span>${plays_by_date[plays_by_date.length - 1][1][track_key]} - ${plays_by_date[plays_by_date.length - 1][1][artist_key]}</a> - ${new Date(plays_by_date[plays_by_date.length - 1][1]['ts'])}`;
        topNListsDiv.before(lastPlayP);
    }

    let topTracksDiv = section.querySelector(`#top-tracks-${year}`);;
    topTracksDiv.innerHTML = '<p class="small"><strong>Top Tracks:</strong></p>';
    top_tracks.forEach((item, index) => {
        topTracksDiv.innerHTML += `<p class="small" title="${item[1]['artist']}">${index + 1}. <a class="track-link" href="${item[0]}"><span class="play_icon">▶</span>${item[1]['track']}</a> - <span class="accent">${item[1]['plays']} plays</span> - <span class="muted">${ms_to_time(item[1]['ms'])}</span></p>`;
    });
    let topArtistsDiv = section.querySelector(`#top-artists-${year}`);
    topArtistsDiv.innerHTML = '<p class="small"><strong>Top Artists:</strong></p>';
    top_artists.forEach((item, index) => {
        topArtistsDiv.innerHTML += `<p class="small">${index + 1}. ${item[0]} - <span class="accent">${item[1]['plays']} plays</span> - <span class="muted">${ms_to_time(item[1]['ms'])}</span></p>`;
    });
    let topAlbumsDiv = section.querySelector(`#top-albums-${year}`);
    topAlbumsDiv.innerHTML = '<p class="small"><strong>Top Albums:</strong></p>';
    top_albums.forEach((item, index) => {
        topAlbumsDiv.innerHTML += `<p class="small" title="${item[1]['artist']}">${index + 1}. ${item[1]['album']} - <span class="accent">${item[1]['plays']} track plays</span> - <span class="muted">${ms_to_time(item[1]['ms'])}</span></p>`;
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

function render_fun_stats(result) {
    // First track played
    // most skipped track
    // plays in country
    // % of time on shuffle

    //Remove existing fun stats panel and tab if they exist
    const existingFunStatsPanel = document.getElementById('panel-fun-stats');
    if (existingFunStatsPanel) {
        existingFunStatsPanel.remove();
    }
    const existingFunStatsTab = document.getElementById('tab-fun-stats');
    if (existingFunStatsTab) {
        existingFunStatsTab.remove();
    }

    const plays_by_date = Object.entries(result.plays).sort((a, b) => new Date(a[1]['ts']) - new Date(b[1]['ts']));

    const first = plays_by_date[0][1];
    const shuffle_percent = (result.shuffle_count / result.plays.length * 100).toFixed(0);

    let section = document.createElement('section');
    section.id = `panel-fun-stats`;
    section.className = 'panel';
    section.setAttribute('aria-labelledby', `tab-fun-stats`);
    section.setAttribute('role', 'tabpanel');
    section.setAttribute('aria-hidden', 'true');
    section.innerHTML = `
        <div class="card">
            <p class="small">First Ever Song: <a class="track-link" href="${first[track_uri_key]}"><span class="play_icon">▶</span>${first[track_key]} - ${first[artist_key]}</a> - ${new Date(first['ts'])}</p>
            <p class="small">On shuffle <span class="accent">${shuffle_percent}%</span> of the time</p>
            <div class="top-n-row">
              <div id="top-skipped" class="top-n"></div>
              <div id="top-countries" class="top-n"></div>
            </div>
            <div id="charts" class="charts-container" aria-hidden="false"></div>
            <div id="map">
                <h3 class="small">Listens by Country</h3>
            </div>
            <div id="platform"></div>
        </div>
    `;

    const sorted_skips = Object.entries(result.skip_counts).sort((a, b) => b[1]['count'] - a[1]['count']).slice(0, top_n);
    let topSkippedDiv = section.querySelector(`#top-skipped`)
    topSkippedDiv.innerHTML = '<p class="small"><strong>Most Skipped Songs:</strong></p>';
    sorted_skips.forEach((item, index) => {
        topSkippedDiv.innerHTML += `<p class="small">${index + 1}. <a class="track-link" href="${item[0]}"><span class="play_icon">▶</span>${item[1]['track']} - ${item[1]['artist']}</a> - ${item[1]['count']} skips</p>`;
    });

    const sorted_countries = Object.entries(result.countries).sort((a, b) => b[1] - a[1]).slice(0, top_n);
    let topCountriesDiv = section.querySelector(`#top-countries`)
    topCountriesDiv.innerHTML = '<p class="small"><strong>Top Countries Listened From:</strong></p>';
    sorted_countries.forEach((item, index) => {
        topCountriesDiv.innerHTML += `<p class="small">${index + 1}. <span class="accent">${regionNamesInEnglish.of(item[0])}</span> - <span class="muted">${item[1]} listens</span></p>`;
    });

    document.getElementById('panel-upload').after(section);

    // Render calendar heatmap into the fun stats panel (if available)
    try {
        if (typeof renderCalendarHeatmap === 'function') {
            const plotEl = renderCalendarHeatmap(result.plays);
            const container = section.querySelector('#charts');
            if (container) {
                if (plotEl && plotEl.nodeType) {
                    container.appendChild(plotEl);
                } else if (plotEl && typeof plotEl.then === 'function') {
                    plotEl.then(el => { if (el && el.nodeType) container.appendChild(el); });
                }
            }
        }
    } catch (err) {
        console.warn('Failed to render calendar heatmap:', err);
    }

    // Render clock chart into the fun stats panel (if available)
    try {
        if (typeof renderClockChart === 'function') {
            const plotEl = renderClockChart(result.plays);
            const container = section.querySelector('#charts');
            if (container) {
                if (plotEl && plotEl.nodeType) {
                    container.appendChild(plotEl);
                } else if (plotEl && typeof plotEl.then === 'function') {
                    plotEl.then(el => { if (el && el.nodeType) container.appendChild(el); });
                }
            }
        }
    } catch (err) {
        console.warn('Failed to render clock chart:', err);
    }

    // Render world map heatmap into the fun stats panel (if available)
    try {
        if (typeof renderGlobeHeatmap === 'function') {
            const plotEl = renderGlobeHeatmap(result.plays);
            const container = section.querySelector('#map');
            if (container) {
                if (plotEl && plotEl.nodeType) {
                    container.appendChild(plotEl);
                } else if (plotEl && typeof plotEl.then === 'function') {
                    plotEl.then(el => { if (el && el.nodeType) container.appendChild(el); });
                }
            }
        }
    } catch (err) {
        console.warn('Failed to render world map heatmap:', err);
    }

    // Render platform over time chart into the fun stats panel (if available)
    try {
        if (typeof renderPlatformOverTime === 'function') {
            const plotEl = renderPlatformOverTime(result.plays);
            const container = section.querySelector('#platform');
            if (container) {
                if (plotEl && plotEl.nodeType) {
                    container.appendChild(plotEl);
                } else if (plotEl && typeof plotEl.then === 'function') {
                    plotEl.then(el => { if (el && el.nodeType) container.appendChild(el); });
                }
            }
        }
    } catch (err) {
        console.warn('Failed to render platform over time chart:', err);
    }

    let button = document.createElement('button');
    button.className = 'tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', 'false');
    button.setAttribute('aria-controls', `panel-fun-stats`);
    button.id = `tab-fun-stats`;
    button.innerText = 'Stats';

    document.getElementById('tab-upload').after(button);
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

    render_fun_stats(result);

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
