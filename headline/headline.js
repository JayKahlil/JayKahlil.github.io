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

// Prefetch/cache implementation that preloads the image itself (so display is instant)
// and avoids returning the same image twice in a row when possible.
let _prefetchedWikimediaJson = null;
let _prefetchedPageId = null;
let _prefetchInFlight = null;
let _lastServedPageId = null;

function _buildWikimediaUrl() {
    const params = new URLSearchParams();
    params.append("action", "query");
    params.append("generator", "random");
    params.append("grnnamespace", "6");
    params.append("prop", "imageinfo");
    params.append("iiprop", "url|extmetadata");
    params.append("iiurlwidth", 645);
    params.append("format", "json");
    params.append("origin", "*");
    return `https://commons.wikimedia.org/w/api.php?${params}`;
}

function _fetchWikimediaJsonOnce() {
    return fetch(_buildWikimediaUrl()).then(r => r.json());
}

function _preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

async function _startPrefetch(maxAttempts = 6) {
    // If there's already a prefetched JSON or a prefetch in flight, do nothing.
    if (_prefetchedWikimediaJson || _prefetchInFlight) return _prefetchInFlight || Promise.resolve(_prefetchedWikimediaJson);

    _prefetchInFlight = (async () => {
        let attempts = 0;
        while (attempts < maxAttempts) {
            attempts++;
            let json;
            try {
                json = await _fetchWikimediaJsonOnce();
            } catch (err) {
                // transient network error — try again
                if (attempts >= maxAttempts) throw err;
                continue;
            }

            if (!json || !json.query || !json.query.pages) {
                if (attempts >= maxAttempts) break;
                continue;
            }

            // Extract single page id & thumb url
            const pageIds = Object.keys(json.query.pages);
            if (pageIds.length === 0) {
                if (attempts >= maxAttempts) break;
                continue;
            }
            const pageId = pageIds[0];
            const page = json.query.pages[pageId];
            const info = page && page.imageinfo && page.imageinfo[0];
            const thumburl = info && info.thumburl;

            if (!thumburl) {
                if (attempts >= maxAttempts) break;
                continue;
            }

            // Avoid prefetching the same page we last served (if possible)
            if (pageId === _lastServedPageId) {
                if (attempts >= maxAttempts) {
                    // give up and accept it
                } else {
                    continue;
                }
            }

            // Also avoid prefetching the image currently displayed in DOM
            try {
                const currentDisplayed = document.getElementById('image') && document.getElementById('image').src;
                if (currentDisplayed && thumburl === currentDisplayed) {
                    if (attempts >= maxAttempts) {
                        // accept it; nothing more we can do
                    } else {
                        continue;
                    }
                }
            } catch {
                /* ignore DOM access issues and proceed */
            }

            // Try to preload the image bytes so when consumed it's instant.
            try {
                await _preloadImage(thumburl);
            } catch {
                // preload failed — try again with another random image
                if (attempts >= maxAttempts) break;
                continue;
            }

            // Success: store the parsed JSON and page id
            _prefetchedWikimediaJson = json;
            _prefetchedPageId = pageId;
            return json;
        }
        // If we exit the loop without successful prefetch, clear and let callers fetch normally
        return null;
    })();

    try {
        const result = await _prefetchInFlight;
        _prefetchInFlight = null;
        return result;
    } catch (err) {
        _prefetchInFlight = null;
        throw err;
    }
}

function getRandomWikimediaImage() {
    // If we have a prefetched JSON ready, return it immediately and
    // kick off a new prefetch in the background.
    if (_prefetchedWikimediaJson) {
        const json = _prefetchedWikimediaJson;
        const pageId = _prefetchedPageId;
        _prefetchedWikimediaJson = null;
        _prefetchedPageId = null;
        _lastServedPageId = pageId;

        // Start fetching the next one but don't wait for it.
        _startPrefetch().catch(() => {});

        return Promise.resolve({ json: () => Promise.resolve(json) });
    }

    // If a prefetch is in flight, return a response-like wrapper that
    // resolves when that prefetch finishes; then start another prefetch.
    if (_prefetchInFlight) {
        const p = _prefetchInFlight;
        const chained = p.then(resJson => {
            if (resJson) {
                // consume it
                _prefetchedWikimediaJson = null;
                _prefetchedPageId = null;
                _lastServedPageId = Object.keys(resJson.query.pages)[0];
            }
            // Immediately start another prefetch
            _startPrefetch().catch(() => {});
            return resJson;
        });
        return Promise.resolve({ json: () => chained });
    }

    // No prefetched data and no in-flight request: perform an immediate
    // fetch+preload for the caller, and start a background prefetch for the next image.
    const immediate = (async () => {
        const json = await _fetchWikimediaJsonOnce();
        // Preload the image for faster display. If preload fails, we still
        // return the JSON so the caller can handle it.
        try {
            const pageId = Object.keys(json.query.pages)[0];
            const info = json.query.pages[pageId].imageinfo[0];
            if (info && info.thumburl) {
                await _preloadImage(info.thumburl);
            }
        } catch {
            /* ignore preload errors */
        }
        // Mark last served page id so prefetch avoids duplicates
        try {
            _lastServedPageId = Object.keys(json.query.pages)[0];
        } catch {
            /* ignore */
        }
        return json;
    })();

    // After immediate returns, start the next prefetch in background
    immediate.then(() => _startPrefetch().catch(() => {})).catch(() => {
        // If immediate failed, still attempt prefetch so future calls can retry.
        _startPrefetch().catch(() => {});
    });

    return Promise.resolve({ json: () => immediate });
}

// Kick off an initial background prefetch
_startPrefetch().catch(() => {});


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
