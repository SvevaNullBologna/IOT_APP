let things = [];

window.all_things_status = all_things_status;
window.readThingMessage = readThingMessage;

function all_things_status(status){
    things.forEach(thing => {
       thing.status = status; 
    });
    
    showThingsList();
} 

// Dependency link: called directly when a service linked to this thing is found running
function wake_thing_by_id(hardwareId) {
    let thing = things.find(t => t.hardware_id === hardwareId);
    
    if (thing) {
        if (thing.status !== "Active") {
            console.log(`Waking up parent Thing node: ${hardwareId} due to incoming service activity.`);
            thing.status = "Active";
            
            store_Things(things);
            showThingsList();
        }
    } else {
        // Fallback: If the thing data structure wasn't declared yet, initialize it on-the-fly
        things.push({
            hardware_id: hardwareId,
            space_id: "Discovered via Service",
            status: "Active"
        });
        store_Things(things);
        showThingsList();
    }
}

// Make sure it's accessible globally by adding it to the bottom of things.js
window.wake_thing_by_id = wake_thing_by_id;

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
    const realSpaceId = tweet['Space ID'] || "Unkbnown Space";
    let thing = things.find(t => t.hardware_id === hardwareId);

    
    if (thing) {
        thing.status = "Active";
       
        if (thing.space_id === "Discovered via Service" || tweet['Space ID']) {
            thing.space_id = realSpaceId;
        }
        
        console.log(`[Things] Updated identity parameters for node: ${hardwareId}`);
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