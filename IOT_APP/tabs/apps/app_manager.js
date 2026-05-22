/*
===========================================
STATE & CONFIGURATION MANAGEMENT
===========================================
*/
const app_folder = "saved_apps";

// Tracks active engine threads running in browser memory
const runningApps = new Map();

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
    pause_app(appName);

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



    if (window.atlas && typeof window.atlas.callService === 'function') {
            window.atlas.callService(thingId, serviceName, values);
            
    }

    //to get feedback, get the field : Service Result

}

function pause_app(app_name){

}

/*
===========================================
SAVE TRANSACTION METHOD
===========================================
*/



////////////////////////////////////////////
//////////// VALIDATION 

function isValidAppName(name) {
    return /^[a-zA-Z0-9_-]{1,20}$/.test(name);
}

function hasValidNodes(nodes){

    if(nodes.length <= 0){
        return false;
    }

    for(const node of nodes){

        const payload = node.getAttribute('data-service');

        if(!payload){
            return false;
        }

        try{

            const serviceObj = JSON.parse(
                decodeURIComponent(atob(payload))
            );

            if(!serviceObj || !serviceObj.service_name){
                return false;
            }

            // validate runtime inputs
            const runtimeInputs = get_service_input(node);

            if(runtimeInputs === null){
                return false;
            }

        }catch(e){
            console.error("Invalid node", e);
            return false;
        }
    }

    return true;
}

function hasValidConnections(nodes, connections){

    if(connections.length <= 0){
        return false;
    }

    for(const node of nodes){

        const connected = connections.some(conn =>
            conn.from === node || conn.to === node
        );

        if(!connected){
            return false;
        }
    }

    return true;
}

function validate_app(app_name, nodes, connections){

    if(!isValidAppName(app_name)){
        return {
            valid: false,
            message: "Invalid app name."
        };
    }

    if(!hasValidNodes(nodes)){
        return {
            valid: false,
            message: "Some nodes contain invalid inputs."
        };
    }

    if(!hasValidConnections(nodes, connections)){
        return {
            valid: false,
            message: "Some services are not connected."
        };
    }

    return {
        valid: true
    };
}

function save_app() {

    const app_name_element = document.getElementById('app_name');

    if(!app_name_element){
        return;
    }

    const app_name = app_name_element.value.trim();

    const dropZone = document.getElementById('drop-editor-zone');

    if(!dropZone){
        return;
    }

    const nodes = Array.from(
        dropZone.querySelectorAll('.canvas-node')
    );

    // VALIDATION
    const validation = validate_app(
        app_name,
        nodes,
        relationshipState.connections
    );

    if(!validation.valid){
        alert(validation.message);
        return;
    }

    // STORAGE STATE
    let saved_apps = get_saved_apps();

    const existingIndex = saved_apps.findIndex(
        app => app.name === app_name
    );

    // OVERWRITE CONFIRM
    if (existingIndex !== -1) {

        if (!confirm(
            `An application named "${app_name}" already exists. Do you want to overwrite it?`
        )) {

            console.log(`[Engine] Overwrite cancelled by user.`);
            return;
        }
    }

    // BUILD RELATIONSHIPS
    const generatedRelationships = [];

    relationshipState.connections.forEach(conn => {

        const cleanRel = make_relationship(
            conn.type,
            conn.from,
            conn.to,
            conn.condition
        );

        if(cleanRel){
            generatedRelationships.push(cleanRel);
        }
    });

    // BUILD SERVICES
    const uniqueServicesMap = new Map();

    nodes.forEach(node => {

        try{

            const payload = node.getAttribute('data-service');

            if(!payload){
                return;
            }

            const serviceObj = JSON.parse(
                decodeURIComponent(atob(payload))
            );

            if(serviceObj && serviceObj.service_name){

                serviceObj.runtime_inputs =
                    get_service_input(node);

                uniqueServicesMap.set(
                    serviceObj.service_name,
                    serviceObj
                );
            }

        }catch(e){
            console.error(
                "Error collecting canvas node data",
                e
            );
        }
    });

    // FINAL APP OBJECT
    const new_app = {
        name: app_name,
        relationships: generatedRelationships,
        services: Array.from(uniqueServicesMap.values())
    };

    // SAVE
    if(existingIndex !== -1){

        saved_apps[existingIndex] = new_app;

        console.log(
            `[Engine] Application "${app_name}" updated successfully.`
        );

    }else{

        saved_apps.push(new_app);

        console.log(
            `[Engine] Application "${app_name}" saved successfully.`
        );
    }

    localStorage.setItem(
        app_folder,
        JSON.stringify(saved_apps)
    );

    alert(`App "${app_name}" saved successfully!`);

    if(typeof renderAppsList === 'function'){
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