// connection/app.js
import { AtlasBridge } from './AtlasBridge.js';

const atlas = new AtlasBridge();
window.atlas = atlas;

let unsubscribeTweet = null;
let unsubscribeStatus = null;

/**
 * Avvia l'ascolto dei tweet dal bridge
 */
function startAtlasListener() {
    // Evita sottoscrizioni multiple
    if (unsubscribeTweet) unsubscribeTweet();
    if (unsubscribeStatus) unsubscribeStatus();

    console.log("Listener Atlas avviato...");

    unsubscribeTweet = atlas.onTweet((tweet) => {
        read_atlas_tweet(tweet);
    });

    unsubscribeStatus = atlas.onStatusChange((isOnline) => {
        if(!isOnline){
            console.log("AtlasBridge disconnected. Forcing things and services offline.");

            if(typeof window.all_things_status === 'function'){
                window.all_things_status('Offline');
            }
            if(typeof window.all_services_status === 'function'){
                window.all_services_status('Offline');
            }

        }
        else{
            console.log("AtlasBridge back online! Waiting for heartbeat tweets...");
        }
    });
}

/**
 * Ferma l'ascolto
 */
function stopAtlasListener() {
    if (unsubscribeTweet) {
        unsubscribeTweet();
        unsubscribeTweet = null;
        console.log("Listener Atlas fermato.");
    }
    if(unsubscribeStatus){
        unsubscribeStatus();
        unsubscribeStatus = null;
    }

    console.log("Listener Atlas fermato.");
}

/**
 * Smista i messaggi alle funzioni globali definite in things.js e services.js
 */
function read_atlas_tweet(tweet) {
    const type = tweet['Tweet Type'];
    if(!type){
        console.log(tweet);
        return;
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
    else if (type === 'Relationship'){
        if(typeof window.readRelationshipMessage === 'function'){
            window.readRelationshipMessage(tweet);
        }
        else{
            console.warn('Funzione readRelationshipMessage non ancora caricata.');
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