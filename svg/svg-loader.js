let play_icon_cache = null;


function play_icon() {
    return fetch('/svg/play-icon.svg')
        .then(response => response.text())
        .then(svgText => {
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            return svgDoc.documentElement;
        });
    
}