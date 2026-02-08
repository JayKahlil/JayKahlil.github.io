import { generateHeadline, loadData } from './generator.js';

// Kick off a background prefetch so the first call to generateHeadline is fast.
// loadData() caches its promise, so this only fetches once.
loadData().catch(err => console.warn('Headline data prefetch failed', err));

document.body.onkeyup = function (e) {
    if (e.keyCode == 32) {
        makeNews();
    }
}

async function makeNews() {
    document.getElementById("image-container").style.display = "none";
    document.getElementById("loader").style.display = "inherit";

    // Wait for data to be loaded inside generateHeadline()
    let headline = null;
    try {
        headline = await generateHeadline();
    } catch (err) {
        console.error('Failed to generate headline:', err);
        headline = 'Could not generate headline';
    }

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
    image.alt = Object.prototype.hasOwnProperty.call(meta, 'ImageDescription') ? meta.ImageDescription.value : "";

    if (Object.prototype.hasOwnProperty.call(meta, 'UsageTerms')) {
        if (meta.UsageTerms.value == "Public domain") {
            document.getElementById("public-domain").style.display = "inline";
            document.getElementById("real-licence").style.display = "none";

        } else {
            document.getElementById("public-domain").style.display = "none";
            document.getElementById("real-licence").style.display = "inline";
            document.getElementById("licence-url").textContent = meta.UsageTerms.value;
        }
    }
    if (Object.prototype.hasOwnProperty.call(meta, 'LicenseUrl')) {
        document.getElementById("licence-url").href = meta.LicenseUrl.value;
    }

    document.getElementById("learn-more-link").href = wikimediaUrls.pop();;

    document.getElementById("artist").textContent = stripHtml(Object.prototype.hasOwnProperty.call(meta, 'Artist') ? meta.Artist.value : "");
}

function stripHtml(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

// Run makeNews when the page loads
window.onload = makeNews;
document.getElementById("image-container").style.display = "none";
document.getElementById("loader").style.display = "inherit";

// Expose makeNews to the global scope so inline onclick attributes can call it
window.makeNews = makeNews;
