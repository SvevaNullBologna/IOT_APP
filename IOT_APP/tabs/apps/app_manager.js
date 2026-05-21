/*
===========================================
STATE & CONFIGURATION MANAGEMENT
===========================================
*/
const app_folder = "saved_apps";

// Tracks active engine threads running in browser memory
const runningApps = new Set();

/*
===========================================
LOCALSTORAGE STORAGE INTERFACE
===========================================
*/
function get_saved_apps(){
    const data = localStorage.getItem(app_folder);
    return data ? JSON.parse(data) : [];
}

function isValidAppName(name) {
    return /^[a-zA-Z0-9_-]{1,20}$/.test(name);
}

/*
===========================================
APPLICATION LIFECYCLE & ENGINE MANAGEMENT
===========================================
*/
function isAppRunning(appName) {
    return runningApps.has(appName);
}

function toggle_app_state(appName, shouldRun) {
    if (shouldRun) {
        runningApps.add(appName);
        console.log(`[Engine] Running application pipeline: ${appName}`);
        // Insert custom instrumentation trigger paths here
    } else {
        runningApps.delete(appName);
        console.log(`[Engine] Application thread halted: ${appName}`);
        // Insert clean teardown commands here
    }

    // Direct cross-file hook update to match graphic button states
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function delete_app(appName) {
    if (!confirm(`Are you sure you want to completely delete "${appName}"?`)) {
        return;
    }

    let saved_apps = get_saved_apps();
    // Exclude application from file list array matches
    saved_apps = saved_apps.filter(app => app.name !== appName);
    
    // Synchronize to physical local text database layout block
    localStorage.setItem(app_folder, JSON.stringify(saved_apps));
    
    // Erase structural references out of active memory tables
    runningApps.delete(appName);

    console.log(`[Engine] Cleared reference storage maps for: ${appName}`);

    // Update frontend interfaces automatically
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}



function run_app(appName){
    if(isAppRunning(appName)){
        console.log(`${appName} is already running`);
        return;
    }

    apps = get_saved_apps();

    
    
    //to make a call to atlas WE need: 
    // Tweet Type : Service call,
    // Thing ID : ID of the smart space declared in the IoT-DDL,
    // Service Name : name of the function to call,
    // Service Inputs : list of expected inputs (0,1,4)


    //to get feedback, get the field : Service Result

}

function pause_app(app_name){

}

/*
===========================================
SAVE TRANSACTION METHOD
===========================================
*/
function save_app() {
    const app_name_element = document.getElementById('app_name');
    if (!app_name_element) return;

    const app_name = app_name_element.value.trim();
    if (!isValidAppName(app_name)) {
        alert("app name not valid");
        return;
    }

    let saved_apps = get_saved_apps();
    const existingIndex = saved_apps.findIndex(app => app.name === app_name);

    if (existingIndex !== -1) {
        if (!confirm(`An application named "${app_name}" already exists. Do you want to overwrite it?`)) {
            console.log(`[Engine] Overwrite cancelled by user.`);
            return; 
        }
    }

    // --- FIX: Extract live relationships and services directly from the active canvas state ---
    const generatedRelationships = [];
    const uniqueServicesMap = new Map();

    // 1. Check if the editor state exists
    if (typeof relationshipState !== 'undefined' && Array.isArray(relationshipState.connections)) {
        relationshipState.connections.forEach(conn => {
            if (typeof make_relationship === 'function') {
                const cleanRel = make_relationship(conn.type, conn.from, conn.to, conn.condition);
                if (cleanRel) {
                    generatedRelationships.push(cleanRel);
                }
            }
        });
    }

    // 2. Scan all nodes currently sitting inside the drop zone to save the service list
    const dropZone = document.getElementById('drop-editor-zone');
    if (dropZone) {
        dropZone.querySelectorAll('.canvas-node').forEach(node => {
            try {
                const payload = node.getAttribute('data-service');
                if (payload) {
                    const serviceObj = JSON.parse(decodeURIComponent(atob(payload)));
                    if (serviceObj && serviceObj.service_name) {
                        uniqueServicesMap.set(serviceObj.service_name, serviceObj);
                    }
                }
            } catch (e) {
                console.error("Error collecting canvas node data for saving:", e);
            }
        });
    }

    const new_app = {
        name: app_name,
        relationships: generatedRelationships,
        services: Array.from(uniqueServicesMap.values())
    };

    if (existingIndex !== -1) {
        saved_apps[existingIndex] = new_app;
        console.log(`[Engine] Application "${app_name}" updated successfully.`);
    } else {
        saved_apps.push(new_app);
        console.log(`[Engine] Application "${app_name}" saved successfully.`);
    }

    localStorage.setItem(app_folder, JSON.stringify(saved_apps));
    alert(`App "${app_name}" saved successfully!`);

    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

/*
===========================================
GLOBAL EXPORT HANDLERS
===========================================
*/
window.get_saved_apps = get_saved_apps;
window.isAppRunning = isAppRunning;
window.toggle_app_state = toggle_app_state;
window.delete_app = delete_app;
window.save_app = save_app;