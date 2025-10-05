const people = [
    "PM",
    "Education Secretary",
    "Health Secretary",
    "Boris",
    "Prince Charles",
    "The Queen",
    "Opposition",
    "a Tory",
    "last Lib Dem",
    "Scotland Yard",
    "Pope",
    "top scientist",
    "Johnson",
    "Sturgeon",
    "Gavin Williamson",
    "Dominic Cummings",
    "Duchess of Sussex",
    "Jacob Rees-Mogg",
    "Jeremy Corbyn",
    "Jeremy Clarkson",
    "Piers Morgan",
    "Nigel Farage",
    "Matt Hancock",
    "Keir Starmer",
    "The King",
    "Russian sausage tycoon",
    "man",
    "woman",
    "child",
    "Mexican president",
    "Rishi Sunak",
    "Count Binface",
    "whistle blower"
];
const pronounClaim = [
    "they claim",
    "they claim",
    "they claim",
    "he claims",
    "he claims",
    "she claims",
    "they claim",
    "they claim",
    "they claim",
    "they claim",
    "he claims",
    "they claim",
    "he claims",
    "she claims",
    "he claims",
    "he claims",
    "she claims",
    "he claims",
    "he claims",
    "he claims",
    "he claims",
    "he claims",
    "he claims",
    "he claims",
    "they claim",
    "he claims",
    "she claims",
    "they claim",
    "they claim"
];
const groups = [
    "immigrants",
    "vegans",
    "geese",
    "the working class",
    "Britons"
];
const subjects = [
    "face masks",
    "quarantine",
    "self isolation",
    "tomato soup",
    "Big Ben",
    "fun",
    "eggs",
    "hand sanitiser",
    "A-levels",
    "GCSEs",
    "Storm Francis",
    "Union Jack",
    "election",
    "virus",
    "French fries",
    "Greek yogurt",
    "COVID-19",
    "Coronavirus",
    "driving tests",
    "MOTs",
    "government approved exercise",
    "mutant algorithm",
    "hacked emails",
    "exams",
    "fish and chips",
    "sunday roast",
    "Brexit",
    "vaccine",
    "pandemic",
    "TikTok",
    "Shrove Tuesday",
    "BBC",
    "second wave",
    "social gatherings of more than six people",
    "Excel spreadsheets",
    "£12 billion for the boys",
    "three tier system",
    "tier 1",
    "tier 2",
    "tier 3",
    "school meals",
    "Boxing day sales",
    "smart phones",
    "national service",
    "military draft"
];
const actions = [
    "banned",
    "required",
    "mandated",
    "outlawed",
    "hoax",
    "rigged",
    "deadly",
    "legalised"
];
const actions2 = [
    "U-turn"
];
const preps = [
    "for",
    "in"
];
const places = [
    "Scotland",
    "Wales",
    "England",
    "Northern Ireland",
    "B&Q",
    "Lidl Middle Aisle",
    "M&S",
    "Tesco",
    "Principality of Sealand",
    "polling booth",
    "Dover",
    "Parliament",
    "Durham",
    "Waitrose",
    "Wetherspoons",
    "the Peak District",
    "a box",
    "Eton",
    "car park in Leicester"
];
const pluralPlaces = [
    "secondary schools",
    "universities",
    "airports",
    "pubs",
    "colleges",
    "care homes"
];
const pActions = [
    "resigns",
    "let go",
    "fired",
    "given promotion",
    "suspended",
    "suspended with full pay",
    "jailed",
    "sentenced",
    "deported",
    "lonely"
];
const links = [
    "amid",
    "after",
    "over"
];
const events = [
    "scandal",
    "controversy",
    "disaster",
    "plot",
    "protests",
    "dispute",
    "riots",
    "fiasco",
    "celebration"
];
const activities = [
    "spotted in",
    "takes trip to",
    "flees",
    "trapped in"
];
const groupActions = [
    "unionise",
    "strike"
];
const emotions = [
    "anger",
    "outrage"
];
const values = [
    "'expert in trade'",
    "'dangerous'",
    "'totally irresponsible'",
    "'my favourite'"
];
const attributions = [
    "says",
    "claims",
    "remarks",
    "according to",
    "alleges"
];
const thoseNotToBeTrusted = [
    "Russian state media",
    "man in trenchcoat",
    "man covered in blood",
    "man covered in ketchup",
    "Boeing",
    "sticky guy"
];
const suspiciousFates = [
    "'fell out of window'",
    "'suffered a heart attack'",
    "'ran into a door'",
    "'fell down stairs'",
    "'fell on knife'",
    "'fell on knife, repeatedly'",
    "got lost swimming"
];
const adjectives = [
    "Russian",
    "American",
    "French",
    "Saudi",
    "Eccentric"
];
const things = [
    "whale",
    "sausage",
    "cactus",
    "vodka",
    "chocolate",
    "roller coaster",
    "Frisbee",
    "lasagne",
    "oil",
    "caviar",
    "penguin",
    "corn",
    "silk"
];
const types = [
    "magnate",
    "tycoon",
    "baron",
    "mogul",
    "merchant"
];
const things2 = [
    "an elf",
    "the moon",
    "your mum",
    "a UFO",
    "bigfoot",
    "jesus",
    "for dinner",
    "a new invention",
    "cool",
    "scary",
    "icky",
    "dijon mustard"
];
const parties = [
    "Tories",
    "Conservatives",
    "Labour",
    "Greens",
    "Greens",
    "Lib Dems",
    "Count Binface",
];
const partiesPossesive = [
    "Tories'",
    "Labour's",
    "Greens'",
    "Lib Dems'",
    "Count Binface's",
];
const leaders = [
    "Rishi Sunak",
    "Rishi Sunak",
    "Keir Starmer",
    "Carla Denyer",
    "Adrian Ramsay",
    "Ed Davey",
    "Count Binface"
];
const policyTypes = [
    "mandatory",
    "compulsory",
    "a ban on",
    "free",
    "bonus"
];

const peopleAndSubjects = [...people, ...subjects];
const allActions = [...actions, ...actions2];
const peopleSubjectsPlaces = [...peopleAndSubjects, ...places];
const allPeople = [...people, ...groups];

var templateValues = [];

const templates = [
    ["%s %s says %s", [peopleAndSubjects, actions, people]],
    ["%s %s %s %s", [subjects, allActions, preps, places]],
    ["%s %s for %s", [subjects, allActions, pluralPlaces]],
    ["%s %s %s %s %s", [allPeople, pActions, links, peopleSubjectsPlaces, events]],
    ["%s %s %s", [allPeople, activities, places]],
    ["%s %s %s %s %s", [groups, groupActions, links, peopleSubjectsPlaces, events]],
    ["%s %s %s %s", [emotions, links, peopleSubjectsPlaces, events]],
    ["%s %s %s %s", [people, values, attributions, people]],
    ["%s %s %s %s", [people, suspiciousFates, attributions, thoseNotToBeTrusted]],
    ["%s %s %s %s %s %s", [adjectives, things, types, suspiciousFates, attributions, thoseNotToBeTrusted]],
    ["%s %s %s %s %s", [adjectives, things, types, activities, places]],
    ["%s %s %s %s", [adjectives, things, types, pActions]],
    ["%s posts photo of what %s is %s", [people, pronounClaim, things2]],
    ["%s will introduce %s %s if elected says %s", [parties, policyTypes, subjects, leaders]],
    ["%s: %s promise %s %s", [leaders, parties, policyTypes, subjects]],
    ["%s pledge to fix %s 'disastrous' %s", [parties, partiesPossesive, subjects]]
]


function generateHeadline() {
    // Get random template and its values array
    const [template, templateFills] = templates[Math.floor(Math.random() * templates.length)];
    
    templateFills.forEach((options, i) => {
        templateValues[i] = getRandomElement(options);
    });
    
    return format(template, ...templateValues);
}

function format(template, ...args) {
    return template.replace(/%s/g, () => args.shift());
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

document.body.onkeyup = function (e) {
    if (e.keyCode == 32) {
        makeNews();
    }
}

function makeNews() {
    document.getElementById("image-container").style.display = "none";
    document.getElementById("loader").style.display = "inherit";
    var headline = generateHeadline();

    document.getElementById("headline").textContent = headline;
    document.title = headline;
    document.querySelector('meta[name="description"]').setAttribute("content", headline);
    document.querySelector('meta[name="title"]').setAttribute("content", headline);
    document.querySelector('meta[name="twitter:title"]').setAttribute("content", headline);

    getRandomWikimediaImage().then(response => response.json()).then(data => processWikimediaJson(data));
}

var image = document.createElement('img');
image.onload = function () {
    document.getElementById("image").src = image.src;
    document.getElementById("image").alt = image.alt;
    document.getElementById("image-container").style.display = "inline";
    document.getElementById("loader").style.display = "none";
};

async function getRandomWikimediaImage() {
    const params = new URLSearchParams();
    params.append("action", "query");
    params.append("generator", "random");
    params.append("grnnamespace", "6");
    params.append("prop", "imageinfo");
    params.append("iiprop", "url|extmetadata");
    params.append("iiurlwidth", 645);
    params.append("format", "json");
    params.append("origin", "*");

    return await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
}


/*
 * JSONP callback that traverses the JSON and sticks it into the html background CSS 
 */
function processWikimediaJson(json) {
    var extmetadata = [];
    var jpg = [];
    var wikimediaUrls = [];
    for (var id in json.query.pages) {
        jpg.push(json.query.pages[id].imageinfo[0].thumburl);
        extmetadata.push(json.query.pages[id].imageinfo[0].extmetadata);
        wikimediaUrls.push(json.query.pages[id].imageinfo[0].descriptionurl);
    }
    var meta = extmetadata.pop();

    image.src = jpg.pop();
    image.alt = meta.hasOwnProperty('ImageDescription') ? meta.ImageDescription.value : "";

    if (meta.hasOwnProperty('UsageTerms')) {
        if (meta.UsageTerms.value == "Public domain") {
            document.getElementById("public-domain").style.display = "inline";
            document.getElementById("real-licence").style.display = "none";

        } else {
            document.getElementById("public-domain").style.display = "none";
            document.getElementById("real-licence").style.display = "inline";
            document.getElementById("licence-url").textContent = meta.UsageTerms.value;
        }
    }
    if (meta.hasOwnProperty('LicenseUrl')) {
        document.getElementById("licence-url").href = meta.LicenseUrl.value;
    }

    document.getElementById("learn-more-link").href = wikimediaUrls.pop();;

    document.getElementById("artist").textContent = stripHtml(meta.hasOwnProperty('Artist') ? meta.Artist.value : "");
}

function stripHtml(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

// Run makeNews when the page loads
window.onload = makeNews;
document.getElementById("image-container").style.display = "none";
document.getElementById("loader").style.display = "inherit";
