let servicesInterval = null;

function readServiceMessage(){
    //
}

function getServiceRepresentation(service){
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

function sortServices(servicesDataArray){
    const actuators = servicesDataArray.filter(s => s.type.toLowerCase() === "actuator");
    const sensors  = servicesDataArray.filter(s => s.type.toLowerCase() === "sensor");

    const sorter = (a, b) => a.service_name.localeCompare(b.service_name);

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