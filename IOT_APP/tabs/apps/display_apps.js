/*
====================================
CURRENT APP STATE
====================================
*/

let currentApp = {
    name: "",
    filename: "",
    finalized: false,
    steps: []
};

/*
====================================
INIT TAB
====================================
*/

function initAppsTab() {
    console.log("Apps initialized");

    // 1. Mostra la lista dei sensori e attuatori sulla sinistra
    if (typeof renderDraggableServicesList === 'function') {
        renderDraggableServicesList();
    }

    // 2. Attiva la Drop Zone per accettare il drag & drop
    if (typeof initDropZone === 'function') {
        initDropZone();
    }

    // 3. Renderizza la lista delle App salvate in alto
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

/*
====================================
CLEANUP
====================================
*/

function cleanupAppsTab() {
    console.log("Apps cleaned up");
    if (typeof clearConnectionPaths === 'function') {
        clearConnectionPaths();
    }
}

/*
====================================
SHOW APP & DYNAMIC CARD RENDERING
====================================
*/

function getAppCard(app) {
    // Safely verify if this app is currently executing via our runtime engine in app.js
    const isRunning = typeof isAppRunning === 'function' && isAppRunning(app.name);

    // Configure state appearance parameters
    const btnText = isRunning ? "Stop ⏸" : "Run ▶";
    const btnClass = isRunning ? "app-toggle-btn running" : "app-toggle-btn stopped";
    const btnAction = isRunning ? `toggle_app_state('${app.name}', false)` : `toggle_app_state('${app.name}', true)`;

    return `
        <div class="iot-card thing-variant saved-app-card">
            <div class="card-header">
                <h4 class="thing-title device-name">${app.name}</h4>
            </div>
            <div class="card-body card-actions-wrapper">
                <!-- SINGLE DYNAMIC ACTION/FEEDBACK BUTTON -->
                <button class="${btnClass}" onclick="${btnAction}">${btnText}</button>
                <button class="delete_app_button" title="deletes selected app" onclick="delete_app('${app.name}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        </div>
    `;
}

function renderAppsList() {
    const savedAppsContainer = document.getElementById('saved-apps-container');

    if (savedAppsContainer) {
        // Read directly from the common local storage shared engine
        const savedAppList = typeof get_saved_apps === 'function' ? get_saved_apps() : [];
        savedAppsContainer.innerHTML = savedAppList.map(getAppCard).join('');
    }
}

/* 
==========================================
GLOBAL EXPORT
===========================================
*/

window.initAppsTab = initAppsTab;
window.cleanupAppsTab = cleanupAppsTab;
window.renderAppsList = renderAppsList;