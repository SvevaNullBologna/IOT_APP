let servicesInterval = null;

function readServiceMessage(){

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


function showServicesList(servicesDataArray){
    
}


function initServicesTab() {
    console.log("Services initialized");
    // Requirement 2: Alphabetical listing logic goes here
    showServicesList();

    servicesInterval = setInterval(() => {
        console.log("updating things...");
    }, 2000);
}
function cleanupServicesTab() {
    console.log("Services cleaned up");

    if(servicesInterval){
        clearInterval(servicesInterval);
        servicesInterval;
    }
}