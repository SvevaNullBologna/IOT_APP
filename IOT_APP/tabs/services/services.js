let services = [];

window.all_services_status = all_services_status;
window.readServiceMessage = readServiceMessage;

function all_services_status(status){
    services.forEach(service => {
       service.status = status; 
    });

    showServicesLists();
} 

function study_API(apiStr) {
    const result = {
        function_name: null,
        inputs: {},   // {input_name: [data_types]}
        outputs: {}   // Placeholder for later use
    };

    if (!apiStr) return result;

    const nameMatch = apiStr.match(/^([^:]+):/);
    if (nameMatch) {
        result.function_name = nameMatch[1].trim();
    }

    // 1. Isolate the input and output :  [, NULL] : (, NULL)
    const inputBracketMatch = apiStr.match(/\[(.*?)\]/);
    const outputBracketMatch = apiStr.match(/\((.*?)\)/);

    if(!inputBracketMatch || !outputBracketMatch){
        return result;
    }

    const inputs =  inputBracketMatch[1];
    const outputs = outputBracketMatch[1];

    function parseTokens(contentStr){
        const cleanStr = contentStr.trim();

        if(!cleanStr || cleanStr.toUpperCase() === 'NULL'){
            return {};
        }

        const rawTokens = cleanStr.split(',').map(t => t.trim());
        const tokens = rawTokens.filter(token => token.toUpperCase() !== 'NULL');

        const map = {};

        for(let i=0; i<tokens.length; i+=2){
            let key = tokens[i];
            let type = tokens[i+1];

            if(key){
                key = key.replace(/^["']|["']$/g, '');
            }

            if(key && type){
                map[key] = type.replace(/^["']|["']$/g, '');
            }
            else if(key && !type){
                map["value"] = key;
            }
        }
        return map;
    }

    result.inputs = parseTokens(inputBracketMatch[1]);
    result.outputs = parseTokens(outputBracketMatch[1]);

    return result;
}

function add_service(serviceID, serviceName, thingId, type, API){
    let service = services.find(s => s.service_id === serviceID && s.service_name === serviceName);

    const parsedAPI = study_API(API);
    
    if (service) {
        service.status = "Active";
        service.type = type;
        service.API = API,
        service.function_name = parsedAPI.function_name || service.function_name;
        service.inputs = parsedAPI.inputs;
        service.outputs = parsedAPI.outputs;
    } else {
        services.push({
            service_name: serviceName,
            service_id: serviceID,
            thing_id: thingId,
            type: type, 
            status: "Active",
            API: API,
            function_name: parsedAPI.function_name,
            inputs: parsedAPI.inputs,
            outputs: parsedAPI.outputs
        });
    }

    if(thingId && typeof window.wake_thing_by_id === 'function'){
        window.wake_thing_by_id(thingId);
    }
    
    if (typeof renderDraggableServicesList === "function") {
        renderDraggableServicesList();
    }

    showServicesLists();

}

function readServiceMessage(tweet){
    const serviceId = tweet['Entity ID'];
    const serviceName = tweet['Name'];
    const thingId = tweet['Thing ID'];
    const API = tweet['API'];
    const type = tweet['Type'];

    if (!serviceId || !serviceName || !thingId || !API || !type) return;

    // Run our structural parsing right now!
    const parsedAPI = study_API(API);

    console.log("PARSED API", parsedAPI);

    add_service(serviceId, serviceName, thingId, type, API, parsedAPI);
    
}

function getServiceCard(service){
    const servicePayload = btoa(encodeURIComponent(JSON.stringify(service)));

    const displayInputs = Object.keys(service.inputs || {}).length > 0 
        ? JSON.stringify(service.inputs) 
        : "None";
        
    const displayOutputs = Object.keys(service.outputs || {}).length > 0 
        ? JSON.stringify(service.outputs) 
        : "None";

    return `
        <div class="iot-card thing-variant"
        ondblclick="window.handleServiceDoubleClick('${servicePayload}', event)">
            <div class="card-header">
                <h4 class="thing-title">${service.service_name}</h4>
                <div class="status-indicator ${service.status.toLowerCase()}"></div>
            </div>
            <div class="card-body">
                <p class="metadata"><strong>Service ID:</strong> ${service.service_id}</p>
                <p class="metadata"><strong>API:</strong> ${service.API}</p>
                <p class="metadata"><strong>Thing ID:</strong> ${service.thing_id}</p>
            </div>
        </div>
    `;
}



window.handleServiceDoubleClick = function(payload, event){
    if(event.target.closest('button') || event.target.closest('svg')){
        return; 
    } 

    try {
        const decodedData = decodeURIComponent(atob(payload));
        const service = JSON.parse(decodedData);
        console.log(`[UI] Double clicked service: ${service.service_name}`);

        if(!window.atlas || !window.atlas.isConnected()){
            alert("Cannot call service: AtlasBridge is currently offline.");
            return;   
        }
        
        const thingId = service.thing_id;
        // Use our clean, pre-parsed functional name!
        const serviceName = service.function_name || service.service_name; 
        let serviceInputs = "()"; 

        // Extract key names dynamically out of our pre-studied object map
        const paramNames = Object.keys(service.inputs || {});

        if (paramNames.length > 0) {
            const inputName = paramNames[0]; 
            const allowedTypes = service.inputs[inputName].join(' or ');

            const userInput = prompt(
                `Service "${serviceName}" requires an argument.\n\n` +
                `Parameter: "${inputName}"\n` +
                `Allowed Types: [${allowedTypes}]\n\n` +
                `Enter value:`
            );

            if (userInput === null) {
                console.log(`[Test Fire] Cancelled call execution.`);
                return;
            }

            serviceInputs = `(${userInput.trim()})`;
        }

        console.log(`[Test Fire] Emitting Pre-Studied Payload: Thing: ${thingId} | Service: ${serviceName} | Inputs: ${serviceInputs}`);
        window.atlas.callService(thingId, serviceName, serviceInputs);
    }
    catch(error){
        console.error("Failed parsing encoded service payload context:", error);
    }
};

function sortServices(){
    // Handles both your mock types (Actuator/Sensor) and Atlas types (Action/Report)
    const actuators = services.filter(s => 
        s.type.toLowerCase() === "actuator" || s.type.toLowerCase() === "action"
    );
    const sensors = services.filter(s => 
        s.type.toLowerCase() === "sensor" || s.type.toLowerCase() === "report"
    );

    const sorter = (a, b) => (a.service_name || "").localeCompare(b.service_name || "");

    return { 
        actuators: actuators.sort(sorter), 
        sensors: sensors.sort(sorter)
    };
}

function showServicesLists(){
    const sorted = sortServices();

    const actuatorHTML = sorted.actuators.map(getServiceCard).join('');
    const sensorHTML = sorted.sensors.map(getServiceCard).join('');

    renderList(actuatorHTML, 'actuators-sensors-list-container');
    renderList(sensorHTML, 'services-sensors-list-container');

    if(typeof renderDraggableServicesList === 'function'){ //keeping drag and rop panel synchronized with active/inactive 
        renderDraggableServicesList();
    }
}


function initServicesTab() {
    console.log("Services initialized");

    // Load persistent data if available, otherwise stay with mock defaults
    showServicesLists();
}

function cleanupServicesTab() {
    console.log("Services cleaned up");
    // Completely clean of any active timers or intervals!
}