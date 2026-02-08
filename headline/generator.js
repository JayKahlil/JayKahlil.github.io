// Browser-safe generator: load data.json via fetch and generate headlines client-side.
let templates = null;
let parts = null;
let dataLoadPromise = null;

export function loadData() {
    if (!dataLoadPromise) {
        // Fetch from the site root; generator.js lives in /headline/, so use absolute path.
        dataLoadPromise = fetch('/headline/data.json').then(res => {
            if (!res.ok) throw new Error('Failed to load headline data.json');
            return res.json();
        }).then(json => {
            templates = json.templates;
            parts = json.parts;
            return json;
        });
    }
    return dataLoadPromise;
}

export async function generateHeadline() {
    // Ensure data is loaded before attempting to generate a headline.
    // Only await loadData() if we don't already have the parsed data —
    // this avoids an unnecessary await when templates/parts are already populated.
    if (!templates || !parts) {
        await loadData();
    }

    // Defensive check in case the JSON didn't provide the expected arrays
    if (!templates || !parts) {
        throw new Error('Headline data not loaded');
    }

    let templateObject = templates[Math.floor(Math.random() * templates.length)];
    let headline = templateObject.template;
    let person = null;
    let party = null;
    for (let i = 0; i < templateObject.types.length; i++) {
        let types = templateObject.types[i];
        for (let j = 0; j < types.length; j++) {
            let positionalPart
            let positionalType = types[j];
            if (positionalType.includes('people[].')) {
                if (!person) {
                    person = parts['people'][Math.floor(Math.random() * parts['people'].length)];
                }
                positionalPart = person[positionalType.split('people[].')[1]];
            } else if (positionalType.includes('parties[].')) {
                if (!party) {
                    party = parts['parties'][Math.floor(Math.random() * parts['parties'].length)];
                }
                positionalPart = party[positionalType.split('parties[].')[1]];
            } else {
                positionalPart = parts[positionalType][Math.floor(Math.random() * parts[positionalType].length)].text;
            }

            headline = headline.replace(`\${vars[${i}]}`, positionalPart);
        }
    }
    return headline;
}