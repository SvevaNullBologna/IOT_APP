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

/*
===========================================
SAVE TRANSACTION METHOD
===========================================
*/
function save_app(relationships, services) {
    const app_name_element = document.getElementById('app_name');
    if (!app_name_element) {
        return;
    }

    // Extracting character string value safely
    const app_name = app_name_element.value.trim();
    if (!isValidAppName(app_name)) {
        alert("app name not valid");
        return;
    }

    const saved_apps = get_saved_apps();

    if (saved_apps.some(app => app.name === app_name)) {
        alert("app name already in use");
        return;
    }

    // Write app JSON descriptor format schema maps
    const new_app = {
        name: app_name,
        relationships: relationships || [],
        services: services || []
    };

    saved_apps.push(new_app);
    localStorage.setItem(app_folder, JSON.stringify(saved_apps));

    alert(`App "${app_name}" saved successfully!`);

    // Signal view layer update to include newly minted card layout maps
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