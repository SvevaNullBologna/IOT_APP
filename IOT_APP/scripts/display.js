
// Example data structure based on "Identity" and "Service" messages
const mockDevices = [
    { name: "Living Room Light", type: "Actuator", address: "192.168.1.10", status: "Active" },
    { name: "Kitchen Temp Sensor", type: "Sensor", address: "192.168.1.11", status: "Active" },
    { name: "Front Door Lock", type: "Actuator", address: "192.168.1.12", status: "Offline" },
    { name: "Desk workers monitor", type: "Sensor", address: "192.168.1.12", status: "Offline" },
    { name: "Laser", type: "Actuator", address: "192.168.1.12", status: "Offline" }
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