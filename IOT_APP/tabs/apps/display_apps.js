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

    // 1. Read real-time engine execution and termination states
    const status = typeof window.getAppStatus === 'function' ? window.getAppStatus(app.name) : "Idle";

    const isRunning = (status === "Running");
    const isPaused = (status === "Paused");

    // 2. Compute visual styling based on the exact outcome
    let statusClass = `saved-app-card status-${status.toLowerCase()}`;
    let borderStyle = "";
    let badgeHTML = "";

    switch (status) {
        case "Running":
            borderStyle = "border-left: 4px solid #10b981; background: #1e293b;"; // Emerald Green Accent
            badgeHTML = `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">Running</span>`;
            break;
        case "Paused":
            borderStyle = "border-left: 4px solid #f59e0b; background: #1e293b;"; // Amber Accent
            badgeHTML = `<span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">Paused</span>`;
            break;
        case "Success":
            borderStyle = "border-left: 4px solid #3b82f6; background: #0f172a;"; // Blue Accent
            badgeHTML = `<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">✔ Finished</span>`;
            break;
        case "ConditionFailed":
            borderStyle = "border-left: 4px solid #f97316; background: #0f172a;"; // Orange Accent (Warning/Stop)
            badgeHTML = `<span style="background: rgba(249, 115, 22, 0.2); color: #fb923c; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">⚠ Blocked</span>`;
            break;
        case "Error":
            borderStyle = "border-left: 4px solid #ef4444; background: #1e1b4b;"; // Intense Dark Red/Indigo Tint
            badgeHTML = `<span style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">✖ Failed</span>`;
            break;
        default:
            borderStyle = "border-left: 4px solid #475569; background: #0f172a;"; // Slate Grey Accent (Idle)
            badgeHTML = `<span style="background: rgba(100, 116, 139, 0.15); color: #94a3b8; padding: 2px 6px; border-radius: 4px; font-size: 0.75em; font-weight: bold; text-transform: uppercase;">Idle</span>`;
    }

    return `
        <div class="iot-card thing-variant ${statusClass}"
            ondblclick="window.handleAppDoubleClick('${appPayload}', event)"
            style="cursor: pointer; user-select: none; margin-bottom: 12px; border-radius: 8px; border: 1px solid #334155; ${borderStyle}"
            title="Double click to open in drop zone">
            
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 12px 6px 12px;">
                <h4 class="thing-title device-name" style="margin: 0; color: #f8fafc; font-size: 1em; font-weight: 600;">${app.name}</h4>
                ${badgeHTML}
            </div>

            <div class="card-body card-actions-wrapper" style="padding: 6px 12px 12px 12px; display: flex; gap: 8px; align-items: center;">
                
                <button class="run_app_button icon-btn" 
                        title="${isPaused ? 'Resume selected app' : 'Run selected app'}" 
                        style="opacity: ${isRunning ? '0.3' : '1'}; cursor: ${isRunning ? 'not-allowed' : 'pointer'}; background: #0284c7; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.85em;"
                        onclick="window.toggle_app_state('${app.name}', true)" ${isRunning ? 'disabled' : ''}>
                    ▶
                </button>
                
                <button class="pause_app_button icon-btn" 
                        title="Pause selected app" 
                        style="opacity: ${!isRunning ? '0.3' : '1'}; cursor: ${!isRunning ? 'not-allowed' : 'pointer'}; background: #475569; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.85em;"
                        onclick="window.toggle_app_state('${app.name}', false)" ${!isRunning ? 'disabled' : ''}> 
                    ⏸
                </button>
                
                <button class="terminate icon-btn" 
                        title="Stop and reset application state" 
                        style="opacity: ${(!isRunning && !isPaused) ? '0.3' : '1'}; cursor: ${(!isRunning && !isPaused) ? 'not-allowed' : 'pointer'}; background: #ef4444; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.85em;"
                        onclick="if(typeof window.terminate_app === 'function') { window.terminate_app('${app.name}'); }" ${(!isRunning && !isPaused) ? 'disabled' : ''}> 
                    ⏹
                </button>

                <button class="delete_app_button icon-btn" 
                        title="Delete selected app completely" 
                        style="background: transparent; color: #94a3b8; border: 1px solid #334155; padding: 5px 9px; border-radius: 4px; margin-left: auto; cursor: pointer; font-size: 0.85em;"
                        onclick="if(typeof window.delete_app === 'function') { window.delete_app('${app.name}'); }">
                    🗑
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
        return; // Prevents loading the app configuration if user clicks control buttons instead
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