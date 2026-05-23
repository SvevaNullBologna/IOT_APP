/*
===========================================
STATE & CONFIGURATION MANAGEMENT
===========================================
*/
const app_folder = "saved_apps";

/*
const new_app = {
        name: app_name,
        relationships: generatedRelationships,
        services: Array.from(uniqueServicesMap.values())
    };

    relationship : 
*/

const runningApps = new Map(); // Stores: appName -> { app, current_node}
const pausedApps = new Map();  // Stores: appName -> { app, current_node}

window.runningApps = runningApps;
window.pausedApps = pausedApps;

/*
===========================================
APPLICATION LIFECYCLE & ENGINE MANAGEMENT
===========================================
*/

//CHECK STATE 

function isAppRunning(appName) {
    return runningApps.has(appName);
}

function isAppPaused(appName){
    return pausedApps.has(appName);
}

//CHANGE OF STATE 

function pause_app(appName) {
    if (isAppRunning(appName)) {
        const runtime = runningApps.get(appName);
        
        //we are not waiting for results anymore
        if (window.atlas && typeof window.atlas.deleteWaitingApp === 'function') {
            window.atlas.deleteWaitingApp(appName);
        }

        runningApps.delete(appName);
        pausedApps.set(appName, runtime); //I guess there is the current node in runtime

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
        run_app(appName);
    }
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}

function terminate_app(appName) {

    if (window.atlas && typeof window.atlas.deleteWaitingApp === 'function') {
        window.atlas.deleteWaitingApp(appName);
    }

    runningApps.delete(appName);
    pausedApps.delete(appName); 


    console.log(`[Engine] Application terminated: ${appName}`);
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}



//change of state 
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



/* ===================================
DYNAMIC PIPELINE EXECUTION CODE
======================================
*/

function readAppCallReply(thingId, serviceName, appName, result, status){
    const runningApp = runningApps.get(appName);
    if(!runningApp) return;

    if(status !== "Successful"){
        console.error(`[Engine] Hardware error execution response for ${appName} on service: ${serviceName}`);
        terminate_app(appName);
        return;
    }

    const relationship = runningApp.app.relationships.find(rel => rel.nameA === runningApp.currentNode);

    // If there's no outgoing relationship, the pipeline successfully finished!
    if (!relationship) {
        console.log(`[Engine] Application ${appName} reached the final node and completed successfully.`);
        terminate_app(appName);
        return;
    }

    // Evaluate condition rules over the hardware result
    if (!evaluate_condition(relationship.condition, result)) {
        console.log(`[Engine] The condition (${relationship.condition}) wasn't met for ${appName} on value: ${result}. Stopping pipeline.`);
        terminate_app(appName);
        return;
    }

    // Move state forward: Update current node to Node B and fire it up!
    console.log(`[Engine] Condition passed! Advancing ${appName} from ${runningApp.currentNode} → ${relationship.nameB}`);
    runningApp.currentNode = relationship.nameB;
    
    execute_service(runningApp);

}

function execute_service(runtime) {
    const appName = runtime.app.name;

    if (!runningApps.has(appName)) return;

    const currentService = runtime.app.services.find(s => s.service_name === runtime.currentNode);
    
    if (!currentService) {
        console.error(`[Engine] Missing blueprint for node service: ${runtime.currentNode}`);
        terminate_app(appName);
        return;
    }

    // 🛠️ FLATTEN THE INPUT OBJECT INTO AN ARRAY OF STRINGS/VALUES
    let processedInputs = [];
    if (currentService.runtime_inputs && typeof currentService.runtime_inputs === 'object') {
        // Extract just the raw text values from the key-value map
        processedInputs = Object.values(currentService.runtime_inputs);
    }

    console.log(`[Engine Process] Triggering Service Execution: "${currentService.service_name}" with inputs:`, processedInputs);

    if (window.atlas && typeof window.atlas.callService === 'function') {
        window.atlas.callService(
            currentService.thing_id, 
            currentService.function_name || currentService.service_name, 
            processedInputs, // Send the clean, flat array instead of the raw map object
            appName
        );
    } else {
        // Local simulation fallback
        console.log(`[Engine Mock] Simulating local callback response for: ${currentService.service_name}`);
        setTimeout(() => {
            readAppCallReply(currentService.thing_id, currentService.service_name, appName, "25", "Successful");
        }, 1500);
    }
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

function run_app(appName) {
    if (isAppRunning(appName)) return;

    let runtime;

    // If it was paused, retrieve its current running context state
    if (isAppPaused(appName)) {
        runtime = pausedApps.get(appName);
        pausedApps.delete(appName);
    } else {
        // Starting totally fresh from the beginning
        const apps = get_saved_apps();
        const app = apps.find(a => a.name === appName);
        if (!app || !app.relationships || app.relationships.length === 0) {
            console.error(`[Engine] Cannot run app: Payload structure invalid or empty.`);
            return;
        }

        // Base Game Rule: Start at the nodeA of the first sequence relationship entry
        const firstNode = app.relationships[0].nameA || app.relationships[0].nodeA;

        runtime = { 
            app, 
            currentNode: firstNode
        };
    }
    
    runningApps.set(appName, runtime);
    console.log(`[Engine Execution] Active workflow loop sequence fired up for: ${appName}. Starting node state: ${runtime.currentNode}`);

    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }

    // FIRE! Kickstart the execution engine
    execute_service(runtime);
}

/*
===========================================
SAVE TRANSACTION METHOD & VALIDATION
===========================================
*/

////////////////////////////VALIDATION 

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

//////////////////////////////////////SAVING 

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

function get_saved_apps(){
    const data = localStorage.getItem(app_folder);
    return data ? JSON.parse(data) : [];
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