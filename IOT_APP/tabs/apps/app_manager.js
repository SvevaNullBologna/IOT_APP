/*
===========================================
STATE & CONFIGURATION MANAGEMENT
===========================================
*/
const app_folder = "saved_apps";

const runningApps = new Map(); // Stores: appName -> { app, currentStepIndex, waitingResolvers }
const pausedApps = new Map();  // Stores: appName -> { app, currentStepIndex, waitingResolvers }

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

function pause_app(appName) {
    if (isAppRunning(appName)) {
        const runtime = runningApps.get(appName);
        
        // 1. Wipe out any pending hardware notices from the bridge
        if (window.atlas && typeof window.atlas.deleteWaitingApp === 'function') {
            window.atlas.deleteWaitingApp(appName);
        }
        
        // 2. Reject current open promise contexts so the execution thread safely breaks
        runtime.waitingResolvers.forEach((rejectFunc) => {
            rejectFunc(new Error("App Paused"));
        });
        runtime.waitingResolvers.clear();

        // 3. Move the bookmark state to paused tracking map
        runningApps.delete(appName);
        pausedApps.set(appName, runtime);

        console.log(`[Engine] Application paused at step index (${runtime.currentStepIndex}): ${appName}`);
    }
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function restart_app(appName){
    if (isAppPaused(appName)) {
        const runtime = pausedApps.get(appName);
        
        pausedApps.delete(appName);
        runningApps.set(appName, runtime);

        console.log(`[Engine] Resuming application from step index (${runtime.currentStepIndex}): ${appName}`);
        
        // Re-ignite continuous runtime loop directly at bookmarked state index
        run_pipeline_loop(runtime);
    }
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function terminate_app(appName) {
    // Force clean the active loop out of memory execution trees
    if (runningApps.has(appName)) {
        runningApps.get(appName).waitingResolvers.forEach(rejectFunc => rejectFunc(new Error("Terminated")));
    }
    
    runningApps.delete(appName);
    pausedApps.delete(appName); 

    if (window.atlas && typeof window.atlas.deleteWaitingApp === 'function') {
        window.atlas.deleteWaitingApp(appName);
    }

    console.log(`[Engine] Application terminated: ${appName}`);
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function toggle_app_state(appName, shouldRun) {
    if (shouldRun) {
        if (isAppPaused(appName)) {
            restart_app(appName);
        } else {
            run_app(appName);
        }
    } else {
        pause_app(appName);
    }
}

function delete_app(appName) {
    if (!confirm(`Are you sure you want to completely delete "${appName}"?`)) {
        return;
    }
    terminate_app(appName);

    let saved_apps = get_saved_apps().filter(app => app.name !== appName);
    localStorage.setItem(app_folder, JSON.stringify(saved_apps));

    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

/* ===================================
DYNAMIC PIPELINE EXECUTION CODE
======================================
*/

function readAppCallReply(thingId, serviceName, appName, result, status){
    const runtime = runningApps.get(appName);
    if (!runtime) return;

    const trackingKey = `${thingId}:${serviceName}`;
    const token = runtime.waitingResolvers.get(trackingKey);

    if (token) {
        runtime.waitingResolvers.delete(trackingKey);
        token.resolve({ result, success: status === "Successful" });
    }
}

async function execute_service(runtime, service) {
    return new Promise((resolve, reject) => {
        // Double check against global collections to confirm active state
        if (!runningApps.has(runtime.app.name)) {
            return reject(new Error("App Paused or Terminated"));
        }

        const trackingKey = `${service.thing_id}:${service.function_name || service.service_name}`;
        
        // Save both resolver and rejector callbacks so lifecycle triggers can break the lock
        runtime.waitingResolvers.set(trackingKey, { resolve, reject });

        if (window.atlas && typeof window.atlas.callService === 'function') {
            window.atlas.callService(
                service.thing_id, 
                service.function_name || service.service_name, 
                service.runtime_inputs || [],
                runtime.app.name
            );
        } else {
            // Simulated local testing pipeline fallback trigger execution
            setTimeout(() => {
                if (runtime.waitingResolvers.has(trackingKey)) {
                    runtime.waitingResolvers.delete(trackingKey);
                    resolve({ result: "25", success: true });
                }
            }, 1500);
        }
    });
}

function evaluate_condition(condition, result) {
    if (!condition || condition.trim() === "" || condition.toUpperCase() === "NULL") {
        return true; 
    }
    try {
        let value = isNaN(result) ? result : Number(result);
        const safeCondition = condition.replace(/[^a-zA-Z0-9\s><=&|!().+-]/g, '');
        return new Function('value', `return ${safeCondition};`)(value);
    } catch(err) {
        console.error("[Engine] Condition evaluation break syntax flaw:", err);
        return false;
    }
}

/**
 * Handles stepping cleanly through the application workflow array loop
 */
async function run_pipeline_loop(runtime) {
    const appName = runtime.app.name;

    // The runtime persists until the execution context is completely dropped out of the running collection map
    while (runningApps.has(appName)) {
        try {
            const relationships = runtime.app.relationships;
            if (!relationships || relationships.length === 0) break;

            // Loop starting from our current tracked index bookmark configuration layer
            for (let i = runtime.currentStepIndex; i < relationships.length; i++) {
                
                // Break out instantly if the app was paused mid-execution array pass
                if (!runningApps.has(appName)) break;
                
                runtime.currentStepIndex = i; // Save progress bookmark index state 
                const relationship = relationships[i];

                const sourceService = runtime.app.services.find(s => s.service_name === relationship.nodeA);
                if (!sourceService) continue;

                console.log(`[Engine] Running Step [${i}] | Service: ${sourceService.service_name}`);
                const responsePayload = await execute_service(runtime, sourceService);

                if (!responsePayload.success) continue;

                const conditionPassed = evaluate_condition(relationship.condition, responsePayload.result);
                if (!conditionPassed) continue; 

                const targetService = runtime.app.services.find(s => s.service_name === relationship.nodeB);
                if (targetService) {
                    await execute_service(runtime, targetService);
                }
            }

            // If the loop finished naturally, reset back to step 0 for next iteration sweep pass
            if (runningApps.has(appName)) {
                runtime.currentStepIndex = 0;
            }

        } catch (error) {
            // Handle expected execution pauses without spamming console breaks
            if (error.message === "App Paused") {
                console.log(`[Engine Loop] Process safely suspended mid-execution sequence step.`);
                return; 
            }
            console.error(`[Engine Core Exception Loop Handlers] Execution failed:`, error);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

function run_app(appName) {
    if (isAppRunning(appName)) return;

    const apps = get_saved_apps();
    const app = apps.find(a => a.name === appName);
    if (!app) return;

    // Instantiate context blueprint setting index track parameters cleanly to 0
    const runtime = { 
        app, 
        currentStepIndex: 0, 
        waitingResolvers: new Map() 
    };
    
    runningApps.set(appName, runtime);
    console.log(`[Engine Execution] Starting brand new loop context sequence ruleset for: ${appName}`);

    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }

    run_pipeline_loop(runtime);
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
                if (get_service_input(node) === null) return false;
            }
        } catch (e) {
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
            return;
        }
        terminate_app(app_name);
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
    } else {
        saved_apps.push(new_app);
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
window.isAppPaused = isAppPaused;
window.toggle_app_state = toggle_app_state;
window.delete_app = delete_app;
window.save_app = save_app;
window.readAppCallReply = readAppCallReply;