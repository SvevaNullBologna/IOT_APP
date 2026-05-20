let services = [];

services.push(
    {service_name: "nome1", service_id: "ID1", API: "[str]=>[NULL]", thing_id: "MSS", type: "Action", status: "Active"},
    {service_name: "nome2", service_id: "ID2", API: "[NULL]=>[str]", thing_id: "MSS", type: "Report", status: "Active"}
);

window.all_services_status = all_services_status;
window.readServiceMessage = readServiceMessage;

function all_services_status(status){
    services.forEach(service => {
       service.status = status; 
    });

    showServicesLists();
} 


function store_Services(servicesData){
    localStorage.setItem('services', JSON.stringify(servicesData));
}

function get_Services(){
    const data = localStorage.getItem('services'); 
    return data ? JSON.parse(data) : [];   
}

function readServiceMessage(tweet){
    const serviceId = tweet['Entity ID'];
    const serviceName = tweet['Name'];
    const thingId = tweet['Thing ID'];

    if (!serviceId || !serviceName) return;

    let service = services.find(s => s.service_id === serviceId && s.service_name === serviceName);

    if (service) {
        service.status = "Active";
        service.API = tweet['API'] || service.API; 
    } else {
        services.push({
            service_name: tweet['Name'],
            service_id: serviceId,
            API: tweet['API'],
            thing_id: thingId,
            type: tweet['Type'], // Atlas sends "Action" or "Report"
            status: "Active"
        });
    }

    if(thingId && typeof window.wake_thing_by_id === 'function'){
        window.wake_thing_by_id(thingId);
    }
    
    if (typeof renderDraggableServicesList === "function") {
        renderDraggableServicesList();
    }

    store_Services(services);
    showServicesLists();
    
}

function getServiceCard(service){
    return `
        <div class="iot-card thing-variant">
            <div class="card-header">
                <h4 class="thing-title">${service.service_name}</h4>
                <div class="status-indicator ${service.status.toLowerCase()}"></div>
            </div>
            <div class="card-body">
                <p class="metadata"><strong>Service ID:</strong> ${service.service_id}</p>
                <p class="metadata"><strong> API:</strong> ${service.API}</p>
                <p class="metadata"><strong>Thing ID:</strong> ${service.thing_id}</p>
            </div>
        </div>
    `;
}

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