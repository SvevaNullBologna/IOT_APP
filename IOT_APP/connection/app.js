//main application logic: connects UI to ATLASBRIDGE and handles UI logic

import { AtlasBridge } from './AtlasBridge.js';

const atlas = new AtlasBridge();

let unsubscribe = null;

function startAtlasListener() {
    if (unsubscribe) unsubscribe();

    unsubscribe = atlas.onTweet((tweet) => {
        console.log("Tweet received:", tweet);
        read_atlas_tweet(tweet);
    });
}

function stopAtlasListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

function read_atlas_tweet(tweet) {
    console.log("UI update:", tweet);

    // example UI injection
    const container = document.getElementById("main-content-area");

    const div = document.createElement("div");
    div.textContent = JSON.stringify(tweet);

    container.appendChild(div);
}

// auto start when page loads
window.addEventListener("DOMContentLoaded", () => {
    startAtlasListener();
});