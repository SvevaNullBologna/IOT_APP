
// Example data structure based on "Identity" and "Service" messages

const mockDevices = [
    {hardware_id: "raspberry", space_id: "VSS", status: "Active"},
    {hardware_id: "arduino", space_id: "VSS", status: "Active"},
    {hardware_id: "chromecast", space_id: "VSS", status: "Active"}
];


const mockServices = [
    { service_name: "Living Room Light", service_id : "led_4", API : "spaceholder", thing_id : "raspberry", type: "Actuator", status: "Active" },
    { service_name: "Kitchen Temp Sensor", service_id : "temp_sens_1", API : "spaceholder",  thing_id : "raspberry", type: "Sensor", status: "Active" },
    { service_name: "Front Door Lock", service_id : "lock_00", API : "spaceholder",  thing_id : "arduino",  type: "Actuator", status: "Offline" },
    { service_name: "Desk workers monitor", service_id : "monitor_1", API : "spaceholder",  thing_id : "chromecast", type: "Sensor", status: "Offline" },
    { service_name: "Laser", service_id : "laser_111", type: "Actuator", API : "spaceholder",  thing_id : "raspberry", status: "Offline" }
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
