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
        inputs: {},   
        outputs: {}   
    };

    if (!apiStr) return result;

    const nameMatch = apiStr.match(/^([^:]+):/);
    if (nameMatch) {
        result.function_name = nameMatch[1].trim();
    }

    const inputBracketMatch = apiStr.match(/\[(.*?)\]/);
    const outputBracketMatch = apiStr.match(/\((.*?)\)/);

    if(!inputBracketMatch || !outputBracketMatch){
        return result;
    }

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

    const parsedAPI = study_API(API);
    add_service(serviceId, serviceName, thingId, type, API, parsedAPI);
}

/*
===========================================
DYNAMIC CARD VIEW RENDERER
===========================================
*/
function getServiceCard(service){
    const servicePayload = btoa(encodeURIComponent(JSON.stringify(service)));
    const inputKeys = Object.keys(service.inputs || {});
    const hasInputs = inputKeys.length > 0;

    let inputsHTML = '<span style="color: #64748b; font-style: italic;">None</span>';
    if (hasInputs) {
        inputsHTML = inputKeys.map(key => 
            `<span style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; margin: 2px; display: inline-block;"><strong>${key}:</strong> ${service.inputs[key]}</span>`
        ).join('');
    }

    let outputsHTML = '<span style="color: #64748b; font-style: italic;">None</span>';
    const outputKeys = Object.keys(service.outputs || {});
    if (outputKeys.length > 0) {
        outputsHTML = outputKeys.map(key => 
            `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; margin: 2px; display: inline-block;"><strong>${key}:</strong> ${service.outputs[key]}</span>`
        ).join('');
    }

    const inputFieldsHTML = inputKeys.map(key => `
        <div style="margin-bottom: 8px; text-align: left;">
            <label style="display: block; font-size: 0.8em; color: #94a3b8; margin-bottom: 3px; font-weight: 500;">${key} (${service.inputs[key]})</label>
            <input type="text" class="card-inline-input" data-param-key="${key}" placeholder="Enter value" required
                   style="width: 100%; padding: 6px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #f8fafc; font-size: 0.85em; box-sizing: border-box; outline: none;">
        </div>
    `).join('');

    // Dynamic generation block for printing your sonar answers or API responses
    let executionResponseHTML = '';
    if (service.last_result !== undefined && service.last_result !== null) {
        const badgeColor = service.last_status ? '#10b981' : '#f59e0b';
        const bgAccent = service.last_status ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)';
        
        executionResponseHTML = `
            <div class="execution-response-container" style="margin-top: 8px; padding: 8px; background: ${bgAccent}; border: 1px solid ${badgeColor}40; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: bold;">Last Return Matrix</span>
                    <span style="font-size: 0.75em; font-weight: bold; color: ${badgeColor};">${service.last_status ? 'SUCCESS' : 'WARNING'}</span>
                </div>
                <div style="font-family: monospace; font-size: 1.1em; color: #f8fafc; font-weight: 600;">
                    ${service.last_result}
                </div>
            </div>
        `;
    }

    return `
        <div class="iot-card thing-variant" style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; margin-bottom: 12px; position: relative; overflow: hidden; display: flex; flex-direction: column;">
            
            <div class="card-status-toast" style="position: absolute; top: 8px; right: 12px; background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75em; font-weight: bold; opacity: 0; transform: translateY(-5px); transition: all 0.3s ease; pointer-events: none; z-index: 10;">Fired!</div>

            <div style="padding: 12px 12px 6px 12px;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <h4 class="thing-title" style="margin: 0; color: #f8fafc; font-size: 1em; font-weight: 600;">${service.service_name}</h4>
                    <div class="status-indicator ${service.status.toLowerCase()}" style="width: 8px; height: 8px; border-radius: 50%; background: ${service.status.toLowerCase() === 'active' ? '#10b981' : '#ef4444'};"></div>
                </div>
                <div class="card-body" style="color: #cbd5e1; font-size: 0.85em; line-height: 1.4;">
                    <p class="metadata" style="margin: 2px 0;"><strong>Service ID:</strong> ${service.service_id}</p>
                    <p class="metadata" style="margin: 2px 0;"><strong>Thing ID:</strong> ${service.thing_id}</p>
                    ${executionResponseHTML} 
                </div>
            </div>

            <div class="input-config-drawer" style="display: none; padding: 4px 12px 10px 12px; background: #111827; border-top: 1px solid #334155; font-size: 0.85em;">
                <p style="margin: 6px 0; color: #cbd5e1;"><strong>API Name:</strong> ${service.function_name || "None"}</p>
                <p style="margin: 4px 0; color: #94a3b8;"><strong>Expected Inputs:</strong> ${inputsHTML}</p>
                <p style="margin: 4px 0; color: #94a3b8; margin-bottom: 10px;"><strong>Outputs:</strong> ${outputsHTML}</p>
                ${hasInputs ? `<div class="inputs-form-container" style="border-top: 1px dashed #334155; padding-top: 8px; margin-top: 8px;">${inputFieldsHTML}</div>` : ''}
            </div>

            <div class="foot-body" style="padding: 8px 12px; border-top: 1px solid #334155; background: #1e293b; display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                <button class="set_input" onclick="window.handle_set_input(this)" title="Toggle Configuration View" 
                        style="background: #334155; color: #cbd5e1; border: 1px solid #475569; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                    ▼
                </button>
                <button class="run" onclick="window.handle_run_service(this, '${servicePayload}')" title="Execute Target System Operation Pipeline" 
                        style="background: #0284c7; color: white; border: none; padding: 4px 14px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: bold; transition: background 0.2s;">
                    ▶
                </button>
            </div>
        </div>
    `;
}

/*
===========================================
INLINE CONTROL LOGIC HANDLERS
===========================================
*/
window.handle_set_input = function(buttonElement) {
    const card = buttonElement.closest('.iot-card');
    const drawer = card.querySelector('.input-config-drawer');
    
    if (drawer) {
        const isHidden = drawer.style.display === 'none';
        drawer.style.display = isHidden ? 'block' : 'none';
        
        // Visual button interaction accent mapping updates
        buttonElement.style.background = isHidden ? '#0284c7' : '#334155';
        buttonElement.style.color = isHidden ? '#ffffff' : '#cbd5e1';
        buttonElement.style.borderColor = isHidden ? '#0284c7' : '#475569';
        buttonElement.innerText = isHidden ? '▲' : '▼';
    }
};

window.handle_run_service = function(buttonElement, encodedPayload) {
    try {
        const decodedData = decodeURIComponent(atob(encodedPayload));
        const service = JSON.parse(decodedData);
        
        const card = buttonElement.closest('.iot-card');
        const inputElements = card.querySelectorAll('.card-inline-input');
        const values = [];
        let validationError = false;

        // Extract input parameter entries directly from the form field elements
        inputElements.forEach(input => {
            const val = input.value.trim();
            if (!val) {
                validationError = true;
                input.style.borderColor = '#ef4444'; // Flashes the border red if missing
            } else {
                input.style.borderColor = '#334155';
                values.push(val);
            }
        });

        if (validationError) {
            // Auto-expand the configuration drawer if a field is missing values
            const drawer = card.querySelector('.input-config-drawer');
            const toggleBtn = card.querySelector('.set_input');
            if (drawer && drawer.style.display === 'none') {
                window.handle_set_input(toggleBtn);
            }
            return;
        }

        const formattedInputString = `(${values.join(',')})`;
        const thingId = service.thing_id;
        const serviceName = service.function_name || service.service_name;

        console.log(`[Inline Runner] Emitting: Thing: ${thingId} | Service: ${serviceName} | Args: ${formattedInputString}`);

        if (window.atlas && typeof window.atlas.callService === 'function') {
            window.atlas.callService(thingId, serviceName, values);
            
            // Trigger the small localized text confirmation banner toast layout
            const toast = card.querySelector('.card-status-toast');
            if (toast) {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
                setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(-5px)';
                }, 1500);
            }
        } else {
            console.error("The native connection bridge layers to window.atlas are unconfigured.");
        }
    } catch (err) {
        console.error("Engine execution state failure evaluating execution string:", err);
    }
};

function readServiceCallReply(thingId, serviceName, result, status){ 
     let service = services.find(s => s.thing_id == thingId && (s.service_name === serviceName || s.function_name === serviceName));
     if(!service){
        console.warn(`[Services] Received reply for untracked service: ${serviceName} on Thing: ${thingId}`);
        return;
     }
    service.last_result = result; 
    service.last_status = status === "Successful";

    console.log("last_result", service.last_result);
    console.log("last_status", service.last_status);
    showServicesLists();
}

/* DISPLAY ON TAB */

function sortServices(){
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

    if(typeof renderDraggableServicesList === 'function'){ 
        renderDraggableServicesList();
    }
}

/* =============================================
TAB LIFE CYCLE
============================================== */
function initServicesTab() {
    console.log("Services initialized");
    showServicesLists();
}

function cleanupServicesTab() {
    console.log("Services cleaned up");
}


window.readServiceCallReply = readServiceCallReply;