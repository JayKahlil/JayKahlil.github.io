import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as csv from 'https://cdn.jsdelivr.net/npm/@vanillaes/csv@3.0.4/+esm'

var svg = d3.select("#graph-svg");
var width = window.innerWidth;
var height = window.innerHeight;

// Set initial SVG dimensions
svg.attr("viewBox", [0, 0, width, height]);

// Add zoom functionality
var g = svg.append("g");

// Handle window resize
window.addEventListener('resize', function () {
    width = window.innerWidth;
    height = window.innerHeight;
    svg.attr("viewBox", [0, 0, width, height]);

    // Update force center when window is resized
    if (simulation) {
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        simulation.alpha(0.3).restart();
    }
});

svg.call(d3.zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([0.1, 4]) // Min and max zoom scale
    .on("zoom", zoomed));

function zoomed(event) {
    g.attr("transform", event.transform);
}

// Declare the chart dimensions and margins.
const marginTop = 20;
const marginRight = 20;
const marginBottom = 30;
const marginLeft = 40;
const lbOrange = "#ee8732";
const lbGreen = "#66dd66";
const lbBlue = "#65baef";

// Define global variables for the visualization
var simulation, link, node, labels, countLabels;

var sampleGraph = {
    nodes: [
        { name: "A" },
        { name: "B" },
        { name: "C" }
    ],
    links: [
        { source: "A", target: "B" },
        { source: "B", target: "C" },
        { source: "C", target: "A" },
        { source: "A", target: "B" }
    ]
};

function runSimulation(graph) {
    // Clear any existing visualization
    g.selectAll("*").remove();

    simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(d => d.name).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);

    link = g
        .append("g")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("stroke", "#d6d6d6ff");

    node = g
        .append("g")
        .selectAll("circle")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("r", 10)
        .attr("fill", function (d) {
            if (d.type === "year") return lbBlue;
            else if (d.count > 1) return lbOrange;
            else return lbGreen;
        })
        .attr("stroke", "#fff")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    // Add count labels inside nodes
    countLabels = g
        .append("g")
        .selectAll("text")
        .data(graph.nodes.filter(d => d.count > 1))
        .enter()
        .append("text")
        .text(d => d.count)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white");

    // Add name labels
    labels = g
        .append("g")
        .selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("font-size", "12px")
        .attr("dx", 15)
        .attr("dy", 4)
        .attr("fill", "white");
}



// Define drag behavior
function dragstarted(event, d) {
    if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active && simulation) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    countLabels
        .attr("x", d => d.x)
        .attr("y", d => d.y);

    labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
}

function parseLetterboxdDiary(diary_csv) {
    const parsed = csv.parse(diary_csv)

    var links = [];
    var filmNodes = {};
    var yearNodes = new Set();

    parsed.shift(); // Remove header row

    parsed.forEach(row => {
        var year = row[7].substring(0, 4);
        links.push({ source: year, target: row[1] });
        filmNodes[row[1]] = (filmNodes[row[1]] || 0) + 1;
        yearNodes.add(year);
    });

    var nodes = Object.entries(filmNodes).map(([key, value]) => ({
        name: key,
        type: "film",
        count: value
    })).concat(Array.from(yearNodes).map(year => ({
        name: year,
        type: "year"
    })));

    return { nodes: nodes, links: links };
}

fetch("diary.csv").then(response => response.text()).then(data => {
    var diaryGraph = parseLetterboxdDiary(data);
    runSimulation(diaryGraph);
});
