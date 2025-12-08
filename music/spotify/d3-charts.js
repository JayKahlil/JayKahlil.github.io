import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function renderClockChart(plays) {
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
    const tickLabelOffset = 6;
    const nTickLabels = radialTicks.length;
    gridG.selectAll('text')
        .data(radialTicks)
        .enter()
        .append('text')
        .attr('x', d => y(d) + tickLabelOffset)
        .attr('y', (d, i) => (i - (nTickLabels - 1) / 2) * 14 + 3)
        .attr('fill', 'white')
        .attr('font-size', 10)
        .attr('font-family', 'sans-serif')
        .text(d => `${d.toFixed(0)}m`);

    // Draw AM and PM lines (no fill)
    svg.append('path')
        .datum(amData)
        .attr('d', lineRadial)
        .attr('fill', 'none')
        .attr('stroke', 'var(--muted)') // AM
        .attr('stroke-width', 1.8)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');

    svg.append('path')
        .datum(pmData)
        .attr('d', lineRadial)
        .attr('fill', 'none')
        .attr('stroke', 'var(--accent)') // PM
        .attr('stroke-width', 1.8)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');

    // Add legend for AM/PM
    const legendG = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${ -outerRadius + 12 }, ${ -outerRadius + 12 })`);

    const legendItems = [
        { label: 'AM (minutes)', color: 'var(--muted)' },
        { label: 'PM (minutes)', color: 'var(--accent)' }
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