import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as csv from 'https://cdn.jsdelivr.net/npm/@vanillaes/csv@3.0.4/+esm'

var svg = d3.select("#graph-svg");
var width = window.innerWidth;
var height = window.innerHeight;

const lbOrange = "#ee8732";
const lbGreen = "#66dd66";
const lbBlue = "#65baef";
const starYellow = "#f5c518";
const starColours = [
    "#ffbb7b",
    "#ffc690",
    "#ffd7ae",
    "#ffebd1",
    "#fff5ec",
    "#fbf8ff",
    "#e4e8ff",
    "#cad8ff",
    "#afc3ff",
    "#9db4ff"
    ];

// Set initial SVG dimensions
svg.attr("viewBox", [0, 0, width, height]);

var defs = svg.append("defs");

var starGradients = [];
starColours.forEach((color, index) => {
    const unqiueId = ((index + 1) / 2.0).toString().replace('.', '-');
    var gradient = defs.append("radialGradient")
        .attr("id", `star-gradient-${unqiueId}`);

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color);

    gradient.append("stop")
        .attr("offset", "80%")
        .attr("stop-color", color);

    gradient.append("stop")
        .attr("offset", "90%")
        .attr("stop-opacity", "90%")
        .attr("stop-color", color);

    gradient.append("stop")
        .attr("offset", "95%")
        .attr("stop-opacity", "70%")
        .attr("stop-color", color);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-opacity", "0%")
        .attr("stop-color", color);

    starGradients.push(gradient);
});

var blackHoleGradient = defs.append("radialGradient")
    .attr("id", "black-hole-gradient");

blackHoleGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#000000ff");

blackHoleGradient.append("stop")
    .attr("offset", "73%")
    .attr("stop-color", "#000000");

blackHoleGradient.append("stop")
    .attr("offset", "77%")
    .attr("stop-color", "#e1c4baff");

blackHoleGradient.append("stop")
    .attr("offset", "81%")
    .attr("stop-color", "#e1c4baff");

blackHoleGradient.append("stop")
    .attr("offset", "85%")
    .attr("stop-color", "#b7664cff");

blackHoleGradient.append("stop")
    .attr("offset", "95%")
    .attr("stop-opacity", "50%")
    .attr("stop-color", "#65392a");

blackHoleGradient.append("stop")
    .attr("offset", "98%")
    .attr("stop-opacity", "20%")
    .attr("stop-color", "#65392a");


blackHoleGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-opacity", "0%")
    .attr("stop-color", "#000000ff");

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
    .scaleExtent([0.05, 4]) // Min and max zoom scale
    .on("zoom", zoomed));

function zoomed(event) {
    g.attr("transform", event.transform);
}

// Define global variables for the visualization
var simulation, link, node, labels, countLabels, yearLabels, graphType, ratingLabels;

function runSimulation(graph) {
    // Clear any existing visualization
    g.selectAll("*").remove();

    simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links).id(d => d.name).distance(200))
        .force("collide", d3.forceCollide(30))
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
        .attr("r", function (d) {
            if (d.type === "year") return 20;
            else return 10;
        })
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
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white");

    // Add year labels inside nodes
    yearLabels = g
        .append("g")
        .selectAll("text")
        .data(graph.nodes.filter(d => d.type === "year"))
        .enter()
        .append("text")
        .text(d => d.label)
        .attr("font-size", "15px")
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white");

    // Add name labels
    labels = g
        .append("g")
        .selectAll("text")
        .data(graph.nodes.filter(d => d.type === "film"))
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("font-size", "12px")
        .attr("font-family", "sans-serif")
        .attr("dx", 15)
        .attr("dy", 4)
        .attr("fill", "white");
}

function runStarSimulation(graph) {
    // Clear any existing visualization
    g.selectAll("*").remove();

    simulation = d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.links)
            .id(d => d.name)
            .distance(d => {
                var rating = d.source.name === "rating-" ? 7 : parseFloat(d.source.name.substring(7)); // Remove 'rating-' prefix
                return ((rating + 4) ** 3) * (d.target.count);
            })
        )
        // .force("collide", d3.forceCollide(50))
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
        .attr("id", function (d) {
            if (d.type === "rating" && d.label === "") return 'black-hole';
        })
        .attr("class", function (d) {
            if (d.type === "rating" && d.label != "") return 'star-node';
        })
        .attr("r", function (d) {
            if (d.type === "rating") {
                var rating = d.label === "" ? 7 : parseFloat(d.label);
                return (rating + 2) ** 3;
            }
            else return 8;
        })
        .attr("fill", function (d) {
            if (d.type === "rating" && d.label != "") {
                return `url('#star-gradient-${d.label.replace('.', '-')}')`;
            }
            else if (d.type === "rating" && d.label === "") return "url('#black-hole-gradient')";
            else if (d.count > 1) return lbOrange;
            else return lbGreen;
        })
        .attr("stroke", function (d) {
            if (d.type === "film") return "#ffffff";
            else if (d.type === "rating" && d.label === "") return "#e4dbb1ff";
        })
        .attr("stroke-dasharray", function (d) {
            if (d.type === "rating" && d.label === "") return "8 14 5 70 17 54 3 20 10 7 5 30";
        })
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
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", "white");

    // Add year labels inside nodes
    ratingLabels = g
        .append("g")
        .selectAll("text")
        .data(graph.nodes.filter(d => d.type === "rating"))
        .enter()
        .append("text")
        .text(d => d.label === "" ? "No Rating" : d.label + "★")
        .attr("font-size", d => {
            var rating = d.label === "" ? 4 : parseFloat(d.label);
            return ((rating + 2) ** 2.7) + "px";
        }) 
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", d => d.label === "" ? "white" : "url('#goldGradient')");

    // Add name labels
    labels = g
        .append("g")
        .selectAll("text")
        .data(graph.nodes.filter(d => d.type === "film"))
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("font-size", "12px")
        .attr("font-family", "sans-serif")
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

    if (yearLabels) {
        yearLabels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }

    labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);

    if (ratingLabels) {
        ratingLabels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }
}

function parseLetterboxdCsv(csv_file, type) {
    const parsed = csv.parse(csv_file)
    const date_index = type === 'diary' ? 7 : 2;

    var links = [];
    var filmNodes = {};
    var yearNodes = new Set();

    parsed.shift(); // Remove header row

    parsed.forEach(row => {
        var year = row[date_index].substring(0, 4);
        links.push({ source: `year-${year}`, target: row[1] });
        filmNodes[row[1]] = (filmNodes[row[1]] || 0) + 1;
        yearNodes.add(year);
    });

    var nodes = Object.entries(filmNodes).map(([key, value]) => ({
        name: key,
        type: "film",
        count: value
    })).concat(Array.from(yearNodes).map(year => ({
        name: `year-${year}`,
        label: year,
        type: "year"
    })));

    return { nodes: nodes, links: links };
}

function parseLetterboxdRatings(csv_file) {
    const parsed = csv.parse(csv_file)

    var links = [];
    var filmNodes = {};
    var starNodes = new Set();

    parsed.shift(); // Remove header row

    parsed.forEach(row => {
        var rating = row[4];
        links.push({ source: `rating-${rating}`, target: row[1] });
        filmNodes[row[1]] = (filmNodes[row[1]] || 0) + 1;
        starNodes.add(rating);
    });

    var nodes = Object.entries(filmNodes).map(([key, value]) => ({
        name: key,
        type: "film",
        count: value
    })).concat(Array.from(starNodes).map(rating => ({
        name: `rating-${rating}`,
        label: rating,
        type: "rating"
    })));

    return { nodes: nodes, links: links };
}

// Set up file input handling
document.getElementById('upload-button').addEventListener('click', () => {
    document.getElementById('csv-upload').click();
});

document.getElementById('csv-upload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const graphData = parseLetterboxdCsv(data, graphType);
            runSimulation(graphData);
            document.getElementById('diary-label').textContent = "Your Custom Letterboxd History";
        };
        reader.readAsText(file);
    }
});

document.querySelectorAll('input[name="graph-type"]').forEach((elem) => {
    if (elem.checked) {
        graphType = elem.value;
    }
    elem.addEventListener("change", function (event) {
        graphType = event.target.value;
        if (graphType === 'release' && document.getElementById('star-toggle-checkbox').checked) {
            document.getElementById('star-toggle-checkbox').click();
            document.getElementById('star-toggle-checkbox').disabled = true;
        } else {
            document.getElementById('star-toggle-checkbox').disabled = false;
        }
        loadJaysGraph(graphType);
    });
});

document.getElementById('star-toggle-checkbox').addEventListener('change', function () {
    if (this.checked) {
        document.getElementById('graph-svg').style.background = "#000000";
        fetch('diary.csv').then(response => response.text()).then(data => {
            var graphData = parseLetterboxdRatings(data);
            runStarSimulation(graphData);
        });
    } else {
        document.getElementById('graph-svg').style.background = "rgb(45, 45, 45)";
        loadJaysGraph(graphType);
    }
});

function loadJaysGraph(type) {
    var path = type === 'diary' ? 'diary.csv' : 'watched.csv';
    fetch(path).then(response => response.text()).then(data => {
        var graphData = parseLetterboxdCsv(data, type);
        runSimulation(graphData);
        document.getElementById('diary-label').innerHTML = `<a id="letterboxd-profile-link" href="https://letterboxd.com/Kahlil/">Jay's Letterboxd History</a>`;
    });
}

loadJaysGraph('diary');

onload = (event) => {
    document.getElementById('star-toggle-checkbox').checked = false;
    document.querySelector('input[id="diary-choice"]').checked = true;
}
