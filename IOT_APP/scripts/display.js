
// Example data structure based on "Identity" and "Service" messages

const mockDevices = [
    {name: "raspberry", address: "192.168.1.10", status: "Active"},
    {name: "arduino", address: "192.168.1.11", status: "Active"},
    {name: "chromecast", address: "192.168.1.12", status: "Active"}
];


const mockServices = [
    { name: "Living Room Light", type: "Actuator", address: "192.168.1.10", status: "Active" },
    { name: "Kitchen Temp Sensor", type: "Sensor", address: "192.168.1.11", status: "Active" },
    { name: "Front Door Lock", type: "Actuator", address: "192.168.1.12", status: "Offline" },
    { name: "Desk workers monitor", type: "Sensor", address: "192.168.1.12", status: "Offline" },
    { name: "Laser", type: "Actuator", address: "192.168.1.12", status: "Offline" }
];



const mockRelationships = [
    // Condition-based: B runs if A returns a specific value
    {
        nameA: "Kitchen Temp Sensor", 
        nameB: "Smart Fan", 
        typeA: "Sensor", 
        typeB: "Actuator", 
        type: "condition", // Used for sortRelationships()
        condition: "> 25°C", 
        status: "Active"
    },
    {
        nameA: "Front Door Lock", 
        nameB: "Hallway Light", 
        typeA: "Actuator", 
        typeB: "Actuator", 
        type: "condition",
        condition: "Unlocked", 
        status: "Active"
    },
    
    // Order-based: B runs after A completes (regardless of value)
    {
        nameA: "Security System", 
        nameB: "Email Notifier", 
        typeA: "Actuator", 
        typeB: "Service", 
        type: "order", 
        condition: null, // Order-based logic has no specific value condition
        status: "Active"
    },
    {
        nameA: "Morning Alarm", 
        nameB: "Coffee Maker", 
        typeA: "Service", 
        typeB: "Actuator", 
        type: "order", 
        condition: null, 
        status: "Offline"
    }
];


function renderList(htmlCardsArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    const listWrapper = document.createElement('div');
    listWrapper.className = 'iot-list-wrapper';

    // It just dumps the HTML you generated in the tab-specific script
    htmlCardsArray.forEach(cardHtml => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        listWrapper.appendChild(tempDiv.firstElementChild);
    });

    container.appendChild(listWrapper);
}




//useful in case of Atlas disconnection. Even thought you visualize them, you cannot use them fully!
function all_unavailable(){

}