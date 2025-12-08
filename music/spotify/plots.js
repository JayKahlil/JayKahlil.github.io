import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

export function renderCalendarHeatmap(plays) {
    // Handle empty plays
    if (!plays || plays.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'heatmap-empty';
        empty.textContent = 'No play data';
        return empty;
    }

    // Prepare data for heatmap
    const playDates = plays.map(play => new Date(play.ts));

    // Aggregate counts by year and month
    const counts = new Map();
    for (const d of playDates) {
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-12
        const key = `${year}-${month}`;
        counts.set(key, (counts.get(key) || 0) + 1);
    }

    // Build full grid (every month for every year in range) so missing months show as zeros
    const minYear = Math.min(...playDates.map(d => d.getFullYear()));
    const maxYear = Math.max(...playDates.map(d => d.getFullYear()));
    const years = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);

    const monthLabels = ['J','F','M','A','M','J','J','A','S','O','N','D'];

    const plotDataFull = [];
    for (const y of years) {
        for (let m = 1; m <= 12; m++) {
            const key = `${y}-${m}`;
            const count = counts.get(key) || 0;
            plotDataFull.push({ year: y, month: m, monthLabel: monthLabels[m - 1], count });
        }
    }

    // Determine count range for color scaling and radius scaling
    const countsOnly = plotDataFull.map(d => d.count).filter(c => c > 0);
    const minCount = countsOnly.length ? Math.min(...countsOnly) : 0;
    const maxCount = countsOnly.length ? Math.max(...countsOnly) : 1;

    // Spotify -> golden yellow colors (green -> yellow for higher counts)
    const COLOR_START = '#1DB954'; // spotify green (low)
    const COLOR_END = '#FFD166'; // golden yellow (high)

    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
    }
    function rgbToHex(r,g,b) {
        const toHex = v => v.toString(16).padStart(2,'0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    function interpolateColor(count) {
        const [r1,g1,b1] = hexToRgb(COLOR_START);
        const [r2,g2,b2] = hexToRgb(COLOR_END);
        const t = maxCount === minCount ? 1 : Math.min(1, Math.max(0, (count - minCount) / (maxCount - minCount)));
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return rgbToHex(r,g,b);
    }

    // Radius scaling: map counts to a larger range for more visible variation
    const R_MIN = 3;
    const R_MAX = 142;
    function radiusFor(count) {
        if (count <= 0) return R_MIN;
        if (maxCount === minCount) return R_MAX;
        const t = (count - minCount) / (maxCount - minCount);
        return R_MIN + t * (R_MAX - R_MIN);
    }

    return Plot.plot({
        width: 450,
        x: { domain: Array.from({length:12}, (_,i) => i+1), label: null, tickFormat: d => monthLabels[d-1] },
        y: { domain: years, label: null, tickFormat: y => String(y).replace(/,/g,'') }, // earliest year at top, no commas
        marks: [
            // Dots for months with plays, sized by count and colored by count
            Plot.dot(plotDataFull.filter(d => d.count > 0), {
                x: 'month',
                y: 'year',
                r: d => radiusFor(d.count), // stronger radius variation
                fill: d => interpolateColor(d.count),
                stroke: 'rgba(0,0,0,0.15)',
                title: d => `${d.year}-${String(d.month).padStart(2, '0')}: ${d.count}`
            }),
            // Red 'x' for months with zero plays
            Plot.text(plotDataFull.filter(d => d.count === 0), {
                x: 'month',
                y: 'year',
                text: () => 'x',
                fill: 'crimson',
                fontSize: 14,
                textAnchor: 'middle'
            })
        ]
    });
}

export async function renderGlobeHeatmap(plays) {
    // Handle empty plays
    if (!plays || plays.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'heatmap-empty';
        empty.textContent = 'No play data';
        return empty;
    }

    // Aggregate counts by conn_country (normalize to upper-case alpha codes)
    const counts = {};
    for (const p of plays) {
        const code = (p.conn_country || '').toString().trim().toUpperCase();
        if (!code) continue;
        counts[code] = (counts[code] || 0) + 1;
    }

    const countsOnly = Object.values(counts);
    const minCount = countsOnly.length ? Math.min(...countsOnly) : 0;
    const maxCount = countsOnly.length ? Math.max(...countsOnly) : 1;

    // Color interpolation helpers (reuse the same palette idea as calendar heatmap)
    const COLOR_START = '#1DB954'; // spotify green (low)
    const COLOR_END = '#FFD166'; // golden yellow (high)
    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
    }
    function rgbToHex(r,g,b) {
        const toHex = v => v.toString(16).padStart(2,'0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    function interpolateColor(count) {
        if (!count || count <= 0) return '#f0f0f0';
        const [r1,g1,b1] = hexToRgb(COLOR_START);
        const [r2,g2,b2] = hexToRgb(COLOR_END);
        const t = maxCount === minCount ? 1 : Math.min(1, Math.max(0, (count - minCount) / (maxCount - minCount)));
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return rgbToHex(r,g,b);
    }

    // Fetch a GeoJSON of countries that contains ISO alpha-2 codes in properties
    // This dataset typically includes an 'ISO_A2' or 'iso_a2' property per feature.
    const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

    let geo = null;
    try {
        const res = await fetch(GEOJSON_URL);
        geo = await res.json();
    } catch (err) {
        console.warn('Failed to fetch countries geojson', err);
        const empty = document.createElement('div');
        empty.className = 'heatmap-empty';
        empty.textContent = 'Failed to load map data';
        return empty;
    }

    const features = geo.features || [];
    if (!features.length) {
        const empty = document.createElement('div');
        empty.className = 'heatmap-empty';
        empty.textContent = 'No map features';
        return empty;
    }

    // Detect likely property name for alpha-2 code
    const sampleProps = features[0].properties || {};
    const candidates = ['ISO_A2','ISO2','ISO2_CODE','iso_a2','ISO_A2_CODE','ISO3166-1-Alpha-2','ADM0_A3'];
    let codeProp = null;
    for (const c of candidates) {
        if (c in sampleProps) { codeProp = c; break; }
    }
    // fallback to 'id' if it looks like a 2-letter code on the first feature
    if (!codeProp) {
        if (features[0].id && typeof features[0].id === 'string' && features[0].id.length === 2) {
            codeProp = 'id';
        }
    }

    // Attach aggregated value to each feature where possible
    for (const f of features) {
        const props = f.properties || {};
        let code = null;
        if (codeProp === 'id') code = f.id;
        else if (codeProp) code = props[codeProp];
        // normalize
        if (code && typeof code === 'string') code = code.trim().toUpperCase();
        // Some datasets use 3-letter codes; we will not attempt conversion here — those features will be left with 0
        const val = counts[code] || 0;
        props._value = val;
        // friendly name for tooltip
        props._name = props.NAME || props.name || props.ADMIN || props.ADMIN0_NAME || props.ADMIN || f.id || 'Unknown';
    }

    // Build the plot
    const plot = Plot.plot({
        width: 900,
        height: 520,
        projection: 'equal-earth',
        marks: [
            Plot.sphere({stroke: "var(--muted)"}),
            Plot.geo(geo, {
                fill: d => interpolateColor(d.properties && d.properties._value),
                stroke: '#222',
                strokeWidth: 0.5,
                title: d => `${d.properties && d.properties._name}: ${d.properties && d.properties._value}`
            })
        ]
    });

    return plot;
}

let uncategorisedPlatforms = new Set();

export function renderPlatformOverTime(plays, platform_grouping_type) {
    // Line chart for 'platform' dataq plays over time, grouped by month
    if (!plays || plays.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'heatmap-empty';
        empty.textContent = 'No play data';
        return empty;
    }

    // Prepare data: aggregate counts by month and platform
    const counts = {};
    for (const p of plays) {
        const date = new Date(p.ts);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const platform = groupPlatform(p.platform, platform_grouping_type);
        const key = `${yearMonth}||${platform}`;
        counts[key] = (counts[key] || 0) + 1;
    }

    // Transform to array for plotting
    const plotData = [];
    for (const key in counts) {
        const [yearMonth, platform] = key.split('||');
        plotData.push({ yearMonth, platform, count: counts[key] });
    }

    plotData.sort((a, b) => {
        if (a.yearMonth < b.yearMonth) return -1;
        if (a.yearMonth > b.yearMonth) return 1;
        if (a.platform < b.platform) return -1;
        if (a.platform > b.platform) return 1;
        return 0;
    });
    // Build ordered list of year-months (e.g. '2025-03') and tick values for years
    const yearMonths = Array.from(new Set(plotData.map(d => d.yearMonth))).sort((a, b) => a.localeCompare(b));
    const years = Array.from(new Set(yearMonths.map(ym => ym.split('-')[0]))).map(Number).sort((a,b) => a-b);
    // use the January month of each year as the tick position so ticks show one per year
    const tickValues = years.map(y => `${String(y)}-01`);

    // Create the plot
    const plot = Plot.plot({
        width: 1100,
        height: 400,
        x: {
            domain: yearMonths,
            // display only the year for tick labels
            tickFormat: d => (typeof d === 'string' ? d.split('-')[0] : d),
            // tick positions: first month of each year
            ticks: tickValues,
            label: null
        },
        y: {
            label: 'Number of Plays'
        },
        marks: [
            Plot.lineY(plotData, { x: 'yearMonth', y: 'count', stroke: 'platform', curve: 'monotone-x' })
        ],
        color: {
            legend: true
        }
    });

    console.log('Uncategorised platforms:', Array.from(uncategorisedPlatforms).sort());
    return plot;
}

function groupPlatform(platform, platform_grouping_type) {
    if (platform_grouping_type === 'device-type') {
        return groupPlatformByType(platform);
    }

    if (!platform) return 'Unknown';
    const p = platform.toLowerCase();
    if (p.includes('android os')) return 'Android';
    if (p.includes('android-tablet os')) return 'Android Tablet';
    if (p.includes('android_tv')) return 'Android TV';
    if (p.includes('ios')) return 'iOS';
    if (p.includes('windows 7')) return 'Windows 7';
    if (p.includes('windows 8')) return 'Windows 8';
    if (p.includes('windows 10')) return 'Windows 10';
    if (p.includes('windows phone')) return 'Windows Phone';
    if (p.includes('windows xp')) return 'Windows XP';
    if (p.includes('xbox')) return 'Xbox';
    if (p.includes('os x')) return 'Mac OS';
    if (p.includes('applewatch')) return 'Apple Watch';
    if (p.includes('sonos')) return 'Sonos';
    if (p.includes('echo_dot')) return 'Alexa';

    if (platform_grouping_type === 'specific-with-other') {
        return platform;
    }
    uncategorisedPlatforms.add(platform);
    return "Other";
}

function groupPlatformByType(platform) {
    if (!platform) return 'Unknown';
    const p = platform.toLowerCase();

    if (p.includes('windows phone') || p.includes('android os') || p.includes('ios') || p.includes('android-tablet os')) return 'Mobile';
    if (p.includes('tv') || p.includes('xbox')) return 'TV';
    if (p.includes('windows') || p.includes('os x')) return 'Desktop';
    if (p.includes('applewatch')) return 'Smart Watch';
    if (p.includes('sonos') || p.includes('echo_dot') || p.includes('denon') || p.includes('yamaha')) return 'Speaker/HiFi';

    uncategorisedPlatforms.add(platform);
    return "Other";
}