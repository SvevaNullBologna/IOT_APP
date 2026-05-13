let servicesInterval = null;


services = [
    { service_name: "Living Room Light", service_id : "led_4", API : "spaceholder", thing_id : "raspberry", type: "Actuator", status: "Active" },
    { service_name: "Kitchen Temp Sensor", service_id : "temp_sens_1", API : "spaceholder",  thing_id : "raspberry", type: "Sensor", status: "Active" },
    { service_name: "Front Door Lock", service_id : "lock_00", API : "spaceholder",  thing_id : "arduino",  type: "Actuator", status: "Offline" },
    { service_name: "Desk workers monitor", service_id : "monitor_1", API : "spaceholder",  thing_id : "chromecast", type: "Sensor", status: "Offline" },
    { service_name: "Laser", service_id : "laser_111", type: "Actuator", API : "spaceholder",  thing_id : "raspberry", status: "Offline" }
    ];


function store_Services(services){
    localStorage.setItem('services', JSON.stringify(services));
}

function get_Services(){
    const data = localStorage.getItem('services'); 
    return data ? JSON.parse(data) : [];   
}



function readServiceMessage(){
    //
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

    const actuatorHTML = actuator_list.map(getServiceCard).join('');
    const sensorHTML = sensor_list.map(getServiceCard).join('');

    renderList(actuatorHTML, 'services-sensors-list-container');
    renderList(sensorHTML, 'actuators-sensors-list-container');
    
}


function initServicesTab() {
    console.log("Services initialized");

    const sorted = sortServices(services);
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