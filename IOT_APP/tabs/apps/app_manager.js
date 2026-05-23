/*
===========================================
STATE & CONFIGURATION MANAGEMENT
===========================================
*/
const app_folder = "saved_apps";

// FIXED: Changed from new Set() to new Map() so .has(), .set(), and .delete() work correctly
const runningApps = new Map(); //we add the currRelationship
const pausedApps = new Map(); //we add the currRelationship

window.runningApps = runningApps;
window.pausedApps = pausedApps;

/*
===========================================
LOCALSTORAGE STORAGE INTERFACE
===========================================
*/
function get_saved_apps(){
    const data = localStorage.getItem(app_folder);
    return data ? JSON.parse(data) : [];
}
/*
===========================================
APPLICATION LIFECYCLE & ENGINE MANAGEMENT
===========================================
*/
function isAppRunning(appName) {
    return runningApps.has(appName);
}

function isAppPaused(appName){
    return pausedApps.has(appName);
}

function pause_app(appName) { //what about results incoming? We erase them all and then send them back up again?
    if (isAppRunning(appName)) {
        const curr_rel = runningApps.get(appName).curr_rel;
        runningApps.delete(appName);
        atlas.deleteWaitingApp(appName);
        pausedApps.add(appName, curr_rel); //add current relationship

        console.log(`[Engine] Application paused: ${appName}`);
    }
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function restart_app(appName){
    if(isAppPaused(appName)){
        const curr_rel = pausedApps.get(appName).curr_rel;
        pausedApps.delete(appName);
        runningApps.add(appName, curr_rel);

        //run_app(appName, curr_rel);

        console.log(`[Engine] Application paused: ${appName}`);
    }
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function terminate_app(appName) {
    runningApps.delete(appName);
    pausedApps.delete(appName); //we do not add the curr relationship

    atlas.deleteWaitingApp(appName);

    console.log(`[Engine] Application terminated: ${appName}`);
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}



function toggle_app_state(appName, shouldRun) {
    if (shouldRun) {
        if (pausedApps.has(appName)) {
            pausedApps.delete(appName);
            // runningApps is now a Map, so we pass the runtime structure or placeholder
            // For toggle simplicity, run_app handles putting the full runtime object in the map
            const app = get_saved_apps().find(a => a.name === appName);
            if(app) {
                const runtime = { app, running: true, waitingResolvers: new Map() };
                runningApps.set(appName, runtime);
                console.log(`[Engine] Resumed application: ${appName}`);
                if (typeof run_pipeline_loop === 'function') run_pipeline_loop(app);
            }
        } else {
            run_app(appName);
        }
    } else {
        pause_app(appName);
    }

    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function delete_app(appName) {
    terminate_app(appName);

    if (!confirm(`Are you sure you want to completely delete "${appName}"?`)) {
        return;
    }

    let saved_apps = get_saved_apps().filter(app => app.name !== appName);
    localStorage.setItem(app_folder, JSON.stringify(saved_apps));

    console.log(`[Engine] Cleared reference storage maps for: ${appName}`);

    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

/* ===================================
DYNAMIC PIPELINE EXECUTION CODE
======================================
*/

function readAppCallReply(thingId, serviceName, appName, result, status){
    console.log("readAppCallReply");
}

/**
 * Executes a service using the event-driven async pattern setup in readServiceCallReply
 */
async function execute_service(runtime, service) {
    return new Promise((resolve, reject) => {
        if (!runtime.running) return reject(new Error("App Paused or Terminated"));

        try {
            // 1. Create a tracking key matching readServiceCallReply pattern
            const trackingKey = `${service.thing_id}:${service.service_name}`;
            
            // 2. Queue up the resolver token into the application runtime context map
            runtime.waitingResolvers.set(trackingKey, resolve);

            // 3. Fire off the actual native hardware command sequence
            const result = window.atlas.callService(
                service.thing_id, 
                service.service_name, 
                service.runtime_inputs || []
            );
            
            // Edge-case: Handle local mocked promises or fast local returns
            if (result instanceof Promise) {
                result.then((res) => {
                    runtime.waitingResolvers.delete(trackingKey);
                    resolve(res);
                }).catch((err) => {
                    runtime.waitingResolvers.delete(trackingKey);
                    reject(err);
                });
            }
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Safely evaluates dynamic string constraints like "value > 10 && value < 50"
 */
function evaluate_condition(condition, result) {
    if (!condition || condition.trim() === "" || condition.toUpperCase() === "NULL") {
        return true; 
    }
    
    try {
        // Prepare scope data environment variables for parsing context execution safely
        let value = isNaN(result) ? result : Number(result);

        // Sanitize out malicious attempts while keeping functional runtime clean
        const safeCondition = condition.replace(/[^a-zA-Z0-9\s><=&|!().+-]/g, '');
        
        // Dynamic conditional evaluator function execution execution engine block
        return new Function('value', `return ${safeCondition};`)(value);
    } catch(err) {
        console.error("[Engine] Condition evaluation parsing structural break syntax flaw:", err);
        return false;
    }
}

/**
 * Runs the application pipeline structurally looping connections
 */
async function run_app(appName) {
    if (isAppRunning(appName)) {
        console.log(`${appName} is already running`);
        return;
    }

    const apps = get_saved_apps();
    const app = apps.find(a => a.name === appName);

    if (!app) {
        console.error(`[Engine] Application entity definition missing matching target context: ${appName}`);
        return;
    }

    const runtime = { app, running: true, waitingResolvers: new Map() };
    runningApps.set(appName, runtime); // This works perfectly now that runningApps is a Map!

    console.log(`[Engine] Starting processing pipeline chain logic rules for: ${appName}`);

    try {
        // Iterate sequentially through connections structural workflow rulesets
        for (const relationship of app.relationships) {
            if (!runtime.running) break;

            // Find origin node service metadata state parameters configuration data
            const sourceService = app.services.find(s => s.service_name === relationship.nodeA);
            if (!sourceService) continue;

            console.log(`[Engine] Processing Node Step: Calling ${sourceService.service_name}...`);
            
            // Await hardware response gracefully using your newly generated promise layer
            const responsePayload = await execute_service(runtime, sourceService);

            // Process rule criteria evaluation
            const conditionPassed = evaluate_condition(relationship.condition, responsePayload.result);
            console.log(`[Engine] Rule Matrix Check [${relationship.condition}] against result (${responsePayload.result}) passed:`, conditionPassed);

            if (!conditionPassed) {
                console.log(`[Engine] Condition failed. Terminating step processing thread down this layout tree branch.`);
                continue; 
            }

            // Target Node Resolution Block Execution Step
            const targetService = app.services.find(s => s.service_name === relationship.nodeB);
            if (targetService) {
                console.log(`[Engine] Pipeline connection routing firing linked target operation: ${targetService.service_name}`);
                await execute_service(runtime, targetService);
            }
        }
    } catch (error) {
        console.error(`[Engine] Active dynamic execution pipeline encountered runtime exception error loop:`, error);
    }
}

/*
===========================================
SAVE TRANSACTION METHOD & VALIDATION
===========================================
*/
function isValidAppName(name) {
    return /^[a-zA-Z0-9_-]{1,20}$/.test(name);
}

function hasValidNodes(nodes) {
    if (nodes.length <= 0) return false;

    for (const node of nodes) {
        const payload = node.getAttribute('data-service');
        if (!payload) return false;

        try {
            const serviceObj = JSON.parse(decodeURIComponent(atob(payload)));
            if (!serviceObj || !serviceObj.service_name) return false;

            if (typeof get_service_input === 'function') {
                const runtimeInputs = get_service_input(node);
                if (runtimeInputs === null) return false;
            }
        } catch (e) {
            console.error("Invalid node context object processing configuration structural mapping", e);
            return false;
        }
    }
    return true;
}

function hasValidConnections(nodes, connections) {
    if (!connections || connections.length <= 0) return false;

    for (const node of nodes) {
        const connected = connections.some(conn => conn.from === node || conn.to === node);
        if (!connected) return false;
    }
    return true;
}

function validate_app(app_name, nodes, connections) {
    if (!isValidAppName(app_name)) {
        return { valid: false, message: "Invalid app name. Use 1-20 alphanumeric characters, dashes, or underscores." };
    }
    if (!hasValidNodes(nodes)) {
        return { valid: false, message: "Some components on the map contain missing or invalid arguments." };
    }
    if (!hasValidConnections(nodes, connections)) {
        return { valid: false, message: "Isolated components found! Ensure every canvas element is completely wired up." };
    }
    return { valid: true };
}

function save_app() {
    const app_name_element = document.getElementById('app_name');
    if (!app_name_element) return;
    const app_name = app_name_element.value.trim();

    const dropZone = document.getElementById('drop-editor-zone');
    if (!dropZone) return;

    const nodes = Array.from(dropZone.querySelectorAll('.canvas-node'));
    const currentConnections = (typeof relationshipState !== 'undefined' && relationshipState.connections) ? relationshipState.connections : [];

    const validation = validate_app(app_name, nodes, currentConnections);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    let saved_apps = get_saved_apps();
    const existingIndex = saved_apps.findIndex(app => app.name === app_name);

    if (existingIndex !== -1) {
        if (!confirm(`An application named "${app_name}" already exists. Do you want to overwrite it?`)) {
            console.log(`[Engine] Overwrite cancelled by user.`);
            return;
        }
        
        // FIXED: Kept strictly inside the block so it only kills the execution state on a deliberate overwrite action
        if (typeof terminate_app === 'function') {
            terminate_app(app_name);
        }
    }

    const generatedRelationships = [];
    currentConnections.forEach(conn => {
        if (typeof make_relationship === 'function') {
            const cleanRel = make_relationship(conn.type, conn.from, conn.to, conn.condition);
            if (cleanRel) generatedRelationships.push(cleanRel);
        }
    });

    const uniqueServicesMap = new Map();
    nodes.forEach(node => {
        try {
            const payload = node.getAttribute('data-service');
            if (!payload) return;

            const serviceObj = JSON.parse(decodeURIComponent(atob(payload)));
            if (serviceObj && serviceObj.service_name) {
                if (typeof get_service_input === 'function') {
                    serviceObj.runtime_inputs = get_service_input(node);
                } else {
                    serviceObj.runtime_inputs = [];
                }
                uniqueServicesMap.set(serviceObj.service_name, serviceObj);
            }
        } catch (e) {
            console.error("Error collecting canvas node data details:", e);
        }
    });

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