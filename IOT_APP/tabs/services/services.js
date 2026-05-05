let servicesInterval = null;

function readServiceMessage(){
    //
}

function getServiceRepresentation(service){
    return `
        <div class="iot-card thing-variant">
            <div class="card-header">
                <h4 class="thing-title">${service.name}</h4>
                <div class="status-indicator ${service.status.toLowerCase()}"></div>
            </div>
            <div class="card-body">
                <p class="metadata"><strong>Hardware:</strong> ${service.type}</p>
                <p class="metadata"><strong>IP Address:</strong> ${service.address}</p>
                <p class="metadata"><strong>System ID:</strong> ${Math.random().toString(16).slice(2, 8)}</p>
            </div>
            <div class="card-footer">
                <button onclick="console.log('Pinging ${service.address}...')">Ping Device</button>
            </div>
        </div>
    `;
}

function sortServices(servicesDataArray){
    const actuators = servicesDataArray.filter(s => s.type.toLowerCase() === "actuator");
    const sensors  = servicesDataArray.filter(s => s.type.toLowerCase() === "sensor");

    const sorter = (a, b) => a.name.localeCompare(b.name);

    return { 
        actuators: actuators.sort(sorter), 
        sensors: sensors.sort(sorter)
    };

}

function showServicesLists(actuator_list, sensor_list){

    const actuatorHTML = actuator_list.map(s => getServiceRepresentation(s));
    const sensorHTML = sensor_list.map(s => getServiceRepresentation(s));

    renderList(actuatorHTML, 'services-sensors-list-container');
    renderList(sensorHTML, 'actuators-sensors-list-container');
    
}


function initServicesTab() {
    console.log("Services initialized");

    const sorted = sortServices(mockServices);
    showServicesLists(sorted.actuators, sorted.sensors, );

    servicesInterval = setInterval(() => {
        console.log("updating things...");
        const update = sortServices(mockDevices);
        showServicesLists(update.actuators, update.sensors);
    }, 2000);
}
function cleanupServicesTab() {
    console.log("Services cleaned up");

    if(servicesInterval){
        clearInterval(servicesInterval);
        servicesInterval = null;
    }
}