
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


function renderList(html, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = `
        <div class="iot-list-wrapper">
            ${html}
        </div>
    `;
}

//useful in case of Atlas disconnection. Even thought you visualize them, you cannot use them fully!
function all_unavailable(){

}


function showConnectionModal() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="connection-modal">
                <h3>Select Connection Type</h3>
                <button id="btn-order">Order Based</button>
                <button id="btn-condition">Condition Based</button>
                <div id="condition-input-area" style="display:none; margin-top:10px;">
                    <input type="text" id="cond-text" placeholder="e.g. value > 10">
                    <button id="btn-confirm-cond">Set Condition</button>
                </div>
                <hr>
                <button id="btn-cancel" style="background: #444;">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // ... event listeners for buttons ...
        // Ensure every button path calls overlay.remove() AND resolve()
        const condArea = overlay.querySelector('#condition-input-area');
        const condInput = overlay.querySelector('#cond-text');

        // Order Based Choice
        overlay.querySelector('#btn-order').onclick = () => {
            cleanup();
            resolve({ type: 'order', condition: null });
        };

        // Show Condition Input
        overlay.querySelector('#btn-condition').onclick = () => {
            condArea.style.display = 'block';
        };

        // Confirm Condition Choice
        overlay.querySelector('#btn-confirm-cond').onclick = () => {
            if (!condInput.value) return alert("Please enter a condition");
            cleanup();
            resolve({ type: 'condition', condition: condInput.value });
        };

        // Cancel
        overlay.querySelector('#btn-cancel').onclick = () => {
            cleanup();
            resolve(null);
        };

        // Add this inside your showConnectionModal function
        overlay.onclick = (event) => {
            if (event.target === overlay) {
                cleanup();
                resolve(null);
            }
        };

        function cleanup() {
            document.body.removeChild(overlay);
        }
    });
}