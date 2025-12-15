const artist_key = 'master_metadata_album_artist_name';
const track_key = 'master_metadata_track_name';
const track_uri_key = 'spotify_track_uri';
const album_key = 'master_metadata_album_album_name';
const show_key = 'episode_show_name';
const podcast_uri_key = 'spotify_episode_uri';

export function getDataForYear(plays, podcast_plays, top_n) {
    const unique_tracks = get_unique_tracks(plays);
    const unique_artists = get_unique_artists(plays);
    const unique_albums = get_unique_albums(plays);
    const unique_podcasts = get_unique_podcasts(podcast_plays);
    const unique_podcast_episodes = get_unique_podcast_episodes(podcast_plays);

    const top_tracks = get_top_n_by_plays(unique_tracks, top_n);
    const top_artists = get_top_n_by_plays(unique_artists, top_n);
    const top_albums = get_top_n_by_plays(unique_albums, top_n);
    const top_podcasts = get_top_n_by_time(unique_podcasts, top_n);

    const play_time_ms = get_play_time(plays);
    const play_time_minutes = ms_to_minutes(play_time_ms);
    const play_time = ms_to_time(play_time_ms);

    const podcast_play_time_ms = get_play_time(podcast_plays);
    const podcast_play_time_minutes = ms_to_minutes(podcast_play_time_ms);
    const podcast_play_time = ms_to_time(podcast_play_time_ms);

    const plays_by_date = Object.entries(plays).sort((a, b) => new Date(a[1]['ts']) - new Date(b[1]['ts']));

    return {
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
    };
}

export function ms_to_minutes(ms) {
    return ms / 1000 / 60;
}

export function ms_to_time(ms) {
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

function get_unique_podcasts(plays) {
    const unique = {};

    plays.forEach(play => {
        const value = play[show_key];
        if (!(value in unique)) {
            unique[value] = {plays: 0, ms: 0, unique_episodes: new Set()};
        }
        unique[value]['plays'] += 1;
        unique[value]['ms'] += play.ms_played || 0;
        unique[value]['unique_episodes'].add(play[podcast_uri_key]);
    });

    return unique;
}

function get_unique_podcast_episodes(plays) {
    const unique = {};

    plays.forEach(play => {
        const value = play[podcast_uri_key];
        if (!(value in unique)) {
            unique[value] = {plays: 0, ms: 0, episode_name: play['episode_name']};
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

function get_top_n_by_time(stats, n) {
    const sorted_stats = Object.entries(stats).sort((a, b) => b[1]['ms'] - a[1]['ms']);

    return sorted_stats.slice(0, n);
}