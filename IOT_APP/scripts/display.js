
// Example data structure based on "Identity" and "Service" messages
const mockDevices = [
    { name: "Living Room Light", type: "Actuator", address: "192.168.1.10", status: "Active" },
    { name: "Kitchen Temp Sensor", type: "Sensor", address: "192.168.1.11", status: "Active" },
    { name: "Front Door Lock", type: "Actuator", address: "192.168.1.12", status: "Offline" }
];


function displayIoTList(dataArray, containerId) {
    const container = document.getElementById(containerId);
    
    // Clear the container first
    container.innerHTML = "";

    // Create a wrapper for the list
    const listWrapper = document.createElement('div');
    listWrapper.className = 'iot-list-wrapper';

    dataArray.forEach(item => {
        const card = document.createElement('div');
        card.className = 'iot-card';
        
        // Build the internal HTML with the required meta info
        card.innerHTML = `
            <div class="card-header">
                <span class="device-name">${item.name}</span>
                <span class="device-status ${item.status.toLowerCase()}">${item.status}</span>
            </div>
            <div class="card-body">
                <p><strong>Type:</strong> ${item.type}</p>
                <p><strong>Address:</strong> ${item.address}</p>
            </div>
        `;
        listWrapper.appendChild(card);
    });

    container.appendChild(listWrapper);
}