let thingsInterval = null;


function readThingMessage(){
    //TODO
}

function getThingRepresentation(device) {
    // Here you define the EXACT HTML for a "Thing" card
    return `
        <div class="iot-card thing-variant">
            <div class="card-header">
                <h4 class="thing-title">${device.name}</h4>
                <div class="status-indicator ${device.status.toLowerCase()}"></div>
            </div>
            <div class="card-body">
                <p class="metadata"><strong>IP Address:</strong> ${device.address}</p>
                <p class="metadata"><strong>System ID:</strong> ${Math.random().toString(16).slice(2, 8)}</p>
            </div>
            <div class="card-footer">
                
            </div>
        </div>
    `;
}

function showThingsList(thingsDataArray){
    const thingsHTMLData = thingsDataArray.map(device => getThingRepresentation(device));
    renderList(thingsHTMLData, 'things-list-container');

}



function initThingsTab() {
    console.log("INIT things");

    //ADD THE DATA INPUT AND DELETE THE MOCK 
    showThingsList(mockDevices); 

    thingsInterval = setInterval(() => {
        console.log("updating things...");
    }, 2000);
}

function cleanupThingsTab() {
    console.log("CLEANUP things");

    if (thingsInterval) {
        clearInterval(thingsInterval);
        thingsInterval = null;
    }
}
