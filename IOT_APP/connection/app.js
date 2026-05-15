// connection/app.js
import { AtlasBridge } from './AtlasBridge.js';

const atlas = new AtlasBridge();
let unsubscribe = null;

/**
 * Avvia l'ascolto dei tweet dal bridge
 */
function startAtlasListener() {
    // Evita sottoscrizioni multiple
    if (unsubscribe) unsubscribe();

    console.log("Listener Atlas avviato...");
    unsubscribe = atlas.onTweet((tweet) => {
        read_atlas_tweet(tweet);
    });
}

/**
 * Ferma l'ascolto
 */
function stopAtlasListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        console.log("Listener Atlas fermato.");
    }
}

/**
 * Smista i messaggi alle funzioni globali definite in things.js e services.js
 */
function read_atlas_tweet(tweet) {
    const type = tweet['Tweet Type'];
    if(!type){
        console.log(tweet);
    }
    else{
        console.log("TYPE:",type);
    }
    if (type === 'Service') {
        // Usiamo window. per sicurezza dato che sono definite in script globali
        if (typeof window.readServiceMessage === 'function') {
            window.readServiceMessage(tweet);
        } else {
            console.warn("Funzione readServiceMessage non ancora caricata.");
        }
    } else if (type === 'Identity_Entity') {
        if (typeof window.readThingMessage === 'function') {
            window.readThingMessage(tweet);
        } else {
            console.warn("Funzione readThingMessage non ancora caricata.");
        }
    }
}

// Avvio automatico al caricamento della pagina
window.addEventListener("DOMContentLoaded", () => {
    startAtlasListener();
});

// Esponiamo le funzioni all'oggetto window per poterle usare 
// altrove o testarle dalla console (F12)
window.getAtlasState = () => atlasState;
window.startAtlasListener = startAtlasListener;
window.stopAtlasListener = stopAtlasListener;
window.read_atlas_tweet = read_atlas_tweet;