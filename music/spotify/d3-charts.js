import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderClockChart(plays, accent = 'var(--accent)', muted = 'var(--muted)') {
    // Aggregate played time (in minutes) separately for AM and PM on a 12-hour (720 minute) clock
    const minutesPerHalfDay = 12 * 60; // 720
    const amMinutes = new Array(minutesPerHalfDay).fill(0);
    const pmMinutes = new Array(minutesPerHalfDay).fill(0);

    for (const play of plays) {
        const d = new Date(play.ts);
        const hour = d.getHours();
        const minute = d.getMinutes();
        const minuteOf12 = (hour % 12) * 60 + minute; // 0..719
        const minutesPlayed = (play.ms_played || 0) / 60000; // convert ms to minutes
        if (hour < 12) {
            amMinutes[minuteOf12] += minutesPlayed;
        } else {
            pmMinutes[minuteOf12] += minutesPlayed;
        }
    }

    const amData = amMinutes.map((minutes, i) => ({ minuteOf12: i, minutes }));
    const pmData = pmMinutes.map((minutes, i) => ({ minuteOf12: i, minutes }));

    const maxMinutes = Math.max(1, d3.max(amMinutes.concat(pmMinutes)) || 1);

    // Dimensions
    const width = 500;
    const height = 500;
    const innerRadius = 150;
    const outerRadius = Math.min(width, height) / 2 - 20;

    // Angle scale maps 0..720 minutes to 0..2PI
    const x = d3.scaleLinear()
        .domain([0, minutesPerHalfDay])
        .range([0, 2 * Math.PI]);

    // Radial scale maps minutes to radii
    const y = d3.scaleLinear()
        .domain([0, maxMinutes])
        .range([innerRadius, outerRadius]);

    // Line generators (no fill) for AM and PM
    const lineRadial = d3.lineRadial()
        .angle(d => x(d.minuteOf12) - Math.PI / 2)
        .radius(d => y(d.minutes))
        .curve(d3.curveCardinalClosed);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height]);

    // Draw concentric radial lines (minute intervals)
    const radialTicks = y.ticks(4).filter(v => v > 0);
    const gridG = svg.append('g').attr('class', 'radial-grid');
    gridG.selectAll('circle')
        .data(radialTicks)
        .enter()
        .append('circle')
        .attr('r', d => y(d))
        .attr('fill', 'none')
        .attr('stroke', '#666')
        .attr('stroke-opacity', 0.35)
        .attr('stroke-dasharray', '3,3');

    // Label radial ticks in minutes (small white numbers) — stack labels vertically to avoid overlap
    gridG.selectAll('text')
        .data(radialTicks)
        .enter()
        .append('text')
        .attr('x', 5)
        .attr('y', d => -y(d) + 3)
        .attr('fill', 'white')
        .attr('font-size', 10)
        .attr('font-family', 'sans-serif')
        .text(d => `${d.toFixed(0)}m`);

    // Draw AM and PM lines (no fill)
    svg.append('path')
        .datum(amData)
        .attr('d', lineRadial)
        .attr('fill', 'none')
        .attr('stroke', muted) // AM
        .attr('stroke-width', 1.8)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');

    svg.append('path')
        .datum(pmData)
        .attr('d', lineRadial)
        .attr('fill', 'none')
        .attr('stroke', accent) // PM
        .attr('stroke-width', 1.8)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');

    // Add legend for AM/PM
    const legendG = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${ -outerRadius + 12 }, ${ -outerRadius + 12 })`);

    const legendItems = [
        { label: 'AM (minutes)', color: muted },
        { label: 'PM (minutes)', color: accent }
    ];

    const itemHeight = 16;
    const itemSpacing = 4;

    const items = legendG.selectAll('g.legend-item')
        .data(legendItems)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * (itemHeight + itemSpacing)})`);

    items.append('rect')
        .attr('width', 12)
        .attr('height', 10)
        .attr('rx', 2)
        .attr('fill', d => d.color)
        .attr('stroke', 'none');

    items.append('text')
        .attr('x', 18)
        .attr('y', 9)
        .attr('fill', 'white')
        .attr('font-size', 11)
        .attr('font-family', 'sans-serif')
        .text(d => d.label);

    // Add hour boundary lines (extend full radius from inner to outer)
    const hours = d3.range(0, 12);
    const hourG = svg.append('g')
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('font-family', 'sans-serif');

    hourG.selectAll('line')
        .data(hours)
        .enter()
        .append('line')
        .attr('x1', d => innerRadius * Math.cos(x(d * 60) - Math.PI / 2))
        .attr('y1', d => innerRadius * Math.sin(x(d * 60) - Math.PI / 2))
        .attr('x2', d => outerRadius * Math.cos(x(d * 60) - Math.PI / 2))
        .attr('y2', d => outerRadius * Math.sin(x(d * 60) - Math.PI / 2))
        .attr('stroke', 'white')
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', 0.8);

    // Hour labels (white)
    hourG.selectAll('text.hour-label')
        .data(hours)
        .enter()
        .append('text')
        .attr('class', 'hour-label')
        .attr('x', d => (outerRadius + 12) * Math.cos(x(d * 60) - Math.PI / 2))
        .attr('y', d => (outerRadius + 12) * Math.sin(x(d * 60) - Math.PI / 2) + 4)
        .attr('fill', 'white')
        .text(d => d === 0 ? '12' : d)
        .attr('font-size', 12)
        .attr('font-family', 'sans-serif');

    return svg.node();
}


let uncategorisedPlatforms = new Set();
export function renderSvgPlatformOverTime(plays, platform_grouping_type) {
    // Line chart for 'platform' dataq plays over time, grouped by month

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
        plotData.push({ yearMonth: new Date(`${yearMonth}-01`), platform, count: counts[key] });
    }

    plotData.sort((a, b) => {
        if (a.yearMonth < b.yearMonth) return -1;
        if (a.yearMonth > b.yearMonth) return 1;
        if (a.platform < b.platform) return -1;
        if (a.platform > b.platform) return 1;
        return 0;
    });
    // Build ordered list of year-months (e.g. '2025-03') and tick values for years
    const yearMonths = Array.from(new Set(plotData.map(d => d.yearMonth))).sort((a, b) => a - b);
    const years = Array.from(new Set(yearMonths.map(ym => ym.getFullYear()))).map(Number).sort((a,b) => a-b);
    // use the January month of each year as the tick position so ticks show one per year
    const tickValues = years.map(y => new Date(`${String(y)}-01-01`));

    // Create the plot
    const svg = d3.create("svg")
        .attr("width", 1100)
        .attr("height", 400);
    const margin = { top: 20, right: 150, bottom: 50, left: 60 };
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleTime()
        .domain(d3.extent(yearMonths))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(plotData, d => d.count)]).nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(Array.from(new Set(plotData.map(d => d.platform))));

    // Axes
    const xAxis = d3.axisBottom(x)
        .tickValues(tickValues)
        .tickFormat(d3.timeFormat("%Y"));

    const yAxis = d3.axisLeft(y);

    const xAxisGroup = g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    xAxisGroup.selectAll(".tick line") // Select the tick lines
        .attr("stroke", "white"); // Set their stroke to white
    xAxisGroup.selectAll(".domain") // Select the axis line
        .attr("stroke", "white"); // Set its stroke to white
    xAxisGroup.selectAll("text")
        .attr("fill", "white") // Add this for tick labels
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const yAxisGroup = g.append("g")
        .call(yAxis);

    yAxisGroup.selectAll(".tick line") // Select the tick lines
        .attr("stroke", "white"); // Set their stroke to white
    yAxisGroup.selectAll(".domain") // Select the axis line
        .attr("stroke", "white"); // Set its stroke to white
    yAxisGroup.selectAll("text") // Select the tick text labels
        .attr("fill", "white"); // Set their fill to white

    yAxisGroup.append("text") // Append the axis label
        .attr("fill", "white")
        .attr("x", 5)
        .attr("y", 15)
        .attr("text-anchor", "start")
        .text("Number of Plays");

    // Line generator
    const line = d3.line()
        .x(d => x(d.yearMonth))
        .y(d => y(d.count));

    // Nest data by platform
    const platforms = d3.groups(plotData, d => d.platform);

    // Draw lines
    for (const [platform, data] of platforms) {
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color(platform))
            .attr("stroke-width", 1.5)
            .attr("d", line);
    }

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 20},${margin.top})`);

    platforms.forEach(([platform], i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(platform));

        legendRow.append("text")
            .attr("fill", "#ffffffff")
            .attr("x", 18)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("text-transform", "capitalize")
            .attr("font-family", "sans-serif")
            .text(platform);
    });

    return svg.node();
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
