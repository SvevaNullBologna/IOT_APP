let thingsInterval = null;

things = [
    {hardware_id: "raspberry", space_id: "VSS", status: "Active"},
    {hardware_id: "arduino", space_id: "VSS", status: "Active"},
    {hardware_id: "chromecast", space_id: "VSS", status: "Active"}
    ];



function store_Things(things){
    localStorage.setItem('things', JSON.stringify(things));
}

function get_Things(){
    const data = localStorage.getItem('things');
    return data ? JSON.parse(data) : [];
}


function readThingMessage(tweet){
    const hardwareId = tweet['Thing ID'];

    // does it already exist?
    let thing = currentThings.find(t => t.hardware_id === hardwareId);

    if (thing) {
        thing.status = "Active";
        thing.space_id = tweet['Space ID'] || thing.space_id;
    } else {
        currentThings.push({
            hardware_id: hardwareId,
            space_id: tweet['Space ID'],
            status: "Active"
        });
    }

    showThingsList();
}

function getThingCard(device) {
    // Here you define the EXACT HTML for a "Thing" card
    return `
        <div class="iot-card thing-variant">
            <div class="card-header">
                <h4 class="thing-title">${device.hardware_id}</h4>
                <div class="status-indicator ${device.status.toLowerCase()}"></div>
            </div>
            <div class="card-body">
                <p class="metadata"><strong>IP Address:</strong> ${device.space_id}</p>
            </div>
            <div class="card-footer">
                
            </div>
        </div>
    `;
}

function showThingsList(thingsDataArray){
    const thingsHTMLData = thingsDataArray.map(getThingCard).join('');
    renderList(thingsHTMLData, 'things-list-container');

}



function initThingsTab() {
    console.log("INIT things");

    //ADD THE DATA INPUT AND DELETE THE MOCK 
    showThingsList(things); 

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
