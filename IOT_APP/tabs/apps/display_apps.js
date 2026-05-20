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
SHOW APP & DYNAMIC CARD RENDERING
====================================
*/

function getAppCard(app) {

    const appPayload = btoa(encodeURIComponent(JSON.stringify(app)));

    return `
        <div class="iot-card thing-variant saved-app-card"
            ondblclick = "window.handleAppDoubleClick('${appPayload}', event)"
            style="cursor: pointer; user-select: none;"
            title="Double click to open in drop zone">
            <div class="card-header">
                <h4 class="thing-title device-name">${app.name}</h4>
            </div>
            <div class="card-body card-actions-wrapper">
                <!-- SINGLE DYNAMIC ACTION/FEEDBACK BUTTON -->
                <button class="run_app_button" title="runs selected app" onclick="run_app('${app.name}')" > |> </button>
                <button class="pause_app_button" title="pauses selected app" onclick="pause_app('${app.name}')" > || </button>
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
====================================
DOUBLE CLICK INTERACTION ROUTER
====================================
*/

window.handleAppDoubleClick = function(payload, event){
    if(event.target.closest('button') || event.target.closest('svg')){
        return; //prevents loading the app if the user is clicking action buttons
    } 

    try{
        const decodedData = decodeURIComponent(atob(payload));
        const app = JSON.parse(decodedData);
        console.log(`[UI] Loaded configuration layout inside drop zone for: ${app.name}`);

        if (typeof window.show_application === 'function') {
            window.show_application(app);
        }
        else{
            console.error("Error: window.show_application is not available or registered.");
        }
    }
    catch(error){
        console.error("Failed parsing encoded application payload context:", error);
    }

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
==========================================
GLOBAL EXPORT
===========================================
*/

window.initAppsTab = initAppsTab;
window.cleanupAppsTab = cleanupAppsTab;
window.renderAppsList = renderAppsList;