let things = [];

function store_Things(thingsData){
    localStorage.setItem('things', JSON.stringify(thingsData));
}

function get_Things(){
    const data = localStorage.getItem('things');
    return data ? JSON.parse(data) : [];
}

function readThingMessage(tweet){
    const hardwareId = tweet['Thing ID'];
    if (!hardwareId) return;

    // does it already exist?
    let thing = things.find(t => t.hardware_id === hardwareId);

    if (thing) {
        thing.status = "Active";
        thing.space_id = tweet['Space ID'] || thing.space_id;
    } else {
        things.push({
            hardware_id: hardwareId,
            space_id: tweet['Space ID'] || "Unknown Space",
            status: "Active"
        });
    }

    store_Things(things);
    showThingsList();
}

function getThingCard(device) {
    return `
        <div class="iot-card thing-variant">
            <div class="card-header">
                <h4 class="thing-title">${device.hardware_id}</h4>
                <div class="status-indicator ${device.status.toLowerCase()}"></div>
            </div>
            <div class="card-body">
                <p class="metadata"><strong>IP Address:</strong> ${device.space_id}</p>
            </div>
            <div class="card-footer"></div>
        </div>
    `;
}

function showThingsList(){
    const thingsHTMLData = things.map(getThingCard).join('');
    renderList(thingsHTMLData, 'things-list-container');
}

function initThingsTab() {
    console.log("INIT things");

    // Load persistent data if available, otherwise fallback to standard mock array
    
    showThingsList(); 
}

function cleanupThingsTab() {
    console.log("CLEANUP things");
    // No intervals left to clear out here anymore!
}