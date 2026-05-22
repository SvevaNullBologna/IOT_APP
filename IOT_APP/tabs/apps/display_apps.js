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

    // Check our live background engine memory maps to see if this app is executing
    const isRunning = typeof window.isAppRunning === 'function' && window.isAppRunning(app.name);

    // Keep your exact original container classes, but toggle an active state class if running
    const statusClass = isRunning ? "saved-app-card active-running" : "saved-app-card";

    return `
        <div class="iot-card thing-variant ${statusClass}"
            ondblclick="window.handleAppDoubleClick('${appPayload}', event)"
            style="cursor: pointer; user-select: none; ${isRunning ? 'border-left: 3px solid #2ecc71;' : ''}"
            title="Double click to open in drop zone">
            <div class="card-header">
                <h4 class="thing-title device-name">${app.name}</h4>
            </div>
            <div class="card-body card-actions-wrapper">
                <button class="run_app_button icon-btn" 
                        title="Runs selected app" 
                        style="opacity: ${isRunning ? '0.3' : '1'}; cursor: ${isRunning ? 'not-allowed' : 'pointer'};"
                        onclick="if(!${isRunning}) { window.toggle_app_state('${app.name}', true); }" ${isRunning ? 'disabled' : ''}>
                    <i class="icon-play"></i>
                </button>
                
                <button class="pause_app_button icon-btn" 
                        title="Pauses selected app" 
                        style="opacity: ${!isRunning ? '0.3' : '1'}; cursor: ${!isRunning ? 'not-allowed' : 'pointer'};"
                        onclick="if(${isRunning}) { window.toggle_app_state('${app.name}', false); }" ${!isRunning ? 'disabled' : ''}> 
                    <i class="icon-pause"></i>
                </button>
                
                <button class="delete_app_button icon-btn" 
                        title="Deletes selected app" 
                        onclick="window.delete_app('${app.name}')">
                    <i class="icon-delete"></i>
                </button>
            </div>
        </div>
    `;
}

function renderAppsList() {
    const savedAppsContainer = document.getElementById('saved-apps-container');

    if (savedAppsContainer) {
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
    if(event.target.closest('button') || event.target.closest('svg') || event.target.closest('i')){
        return; // Prevents loading the app if the user is clicking action buttons
    } 

    try {
        const decodedData = decodeURIComponent(atob(payload));
        const app = JSON.parse(decodedData);
        console.log(`[UI] Loaded configuration layout inside drop zone for: ${app.name}`);

        if (typeof window.show_application === 'function') {
            window.show_application(app);
        } else {
            console.error("Error: window.show_application is not available or registered.");
        }
    } catch(error) {
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

    if (typeof renderDraggableServicesList === 'function') {
        renderDraggableServicesList();
    }

    if (typeof initDropZone === 'function') {
        initDropZone();
    }

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

/* ==========================================
GLOBAL EXPORT
===========================================
*/
window.initAppsTab = initAppsTab;
window.cleanupAppsTab = cleanupAppsTab;
window.renderAppsList = renderAppsList;