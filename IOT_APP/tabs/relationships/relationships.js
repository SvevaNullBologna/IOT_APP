let relationshipsInterval = null;

function readRelationshipMessage(){
    //TODO
}


function getRelationshipRepresentation(rel) { //the status of relationships is an STATUSA & STATUSB 
    const isCondition = rel.condition !== null;
    
    return `
        <div class="iot-card rel-card">
            <div class="card-header">
                <span class="rel-type-tag">${rel.type.toUpperCase()}</span>
                <div class="status-indicator ${rel.status.toLowerCase()}"></div>
            </div>
            
            <div class="card-body">
                <div class="rel-flow">
                    <strong>${rel.nameA}</strong>
                    <span class="flow-arrow">→</span>
                    <strong>${rel.nameB}</strong>
                </div>
                
                <p class="rel-logic">
                    ${isCondition 
                        ? `IF <code>${rel.condition}</code>` 
                        : `THEN RUN`}
                </p>
            </div>
        </div>
    `;
}

function sortRelationships(relationshipDataArray){
    const condition_rel = relationshipDataArray.filter(r => r.type.toLowerCase() === "condition");
    const order_rel  = relationshipDataArray.filter(r => r.type.toLowerCase() === "order");

    const sorter = (a, b) => a.nameA.localeCompare(b.nameA);

    return { 
        conditions: condition_rel.sort(sorter), 
        orders: order_rel.sort(sorter)
    };

}

function showRelationshipsLists(conditions, orders){
    const conditionHTML = conditions.map(r => getRelationshipRepresentation(r));
    const orderHTML = orders.map(r => getRelationshipRepresentation(r));

    renderList(conditionHTML, 'relationships-order-based-container');
    renderList(orderHTML, 'relationships-condition-based-container');
}


/*DRAGGABLE SERVICES*/

function getDraggableServiceRepresentation(service){
    const payload = btoa(JSON.stringify(service));
    return `
        <div class="iot-card draggable-item" draggable="true" data-service='${payload}' ondragstart="onServiceDragStart(event)">
            <div class="card-header">
                <h4 class="thing-title">${service.service_name}</h4>
            </div>
            <div class="card-body">
                <p class="metadata"><strong> API:</strong> ${service.API}</p>
                <p class="metadata"><strong>Thing ID:</strong> ${service.thing_id}</p>
            </div>
        </div>
    `;

}

function renderDraggableServicesList() {
    const container = document.getElementById('things-editor-zone');
    if (!container) return;

    // Grouping logic
    const sensors = mockServices.filter(s => s.type === "Sensor");
    const actuators = mockServices.filter(s => s.type === "Actuator");

    const createSection = (title, items) => `
        <div class="sidebar-section">
            <h5 style="color: #888; border-bottom: 1px solid #444; margin: 10px 0;">${title}</h5>
            ${items.map(s => getDraggableServiceRepresentation(s)).join('')}
        </div>
    `;

    container.innerHTML = `
        ${createSection('SENSORS', sensors)}
        ${createSection('ACTUATORS', actuators)}
    `;
}

function initDropZone(){
    const zone = document.getElementById('drop-editor-zone');
    
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    });

    zone.addEventListener('drop', (e) => {
    e.preventDefault();
    
    // Change this from "application/json" to "text/plain"
    const payload = e.dataTransfer.getData("text/plain"); 
    
    if (!payload) {
        console.error("Drop failed: No payload received");
        return;
    }

    try {
        const service = JSON.parse(atob(payload));
        
        const rect = zone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        spawnNodeInCanvas(service, x, y);
    } catch (err) {
        console.error("Error parsing drop data:", err);
    }
});
}

/* DROP EDITOR ZONE  */

let spawnCounter = 0; // Global counter to offset drops

function spawnNodeInCanvas(service, x, y) {
    const zone = document.getElementById('drop-editor-zone');
    const node = document.createElement('div');
    
    const offset = (spawnCounter % 5) * 10;
    spawnCounter++;

    const typeClass = service.type === "Actuator" ? "actuator-node" : "sensor-node";

    node.className = `iot-card canvas-node ${typeClass}`;
    node.style.position = 'absolute';
    node.style.left = (x + offset) + 'px';
    node.style.top = (y + offset) + 'px';
    node.style.width = '220px'; // Slightly wider to accommodate the button

    node.innerHTML = `
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <strong>${service.service_name}</strong>
            <button class="delete-btn" title="Remove from canvas">×</button>
        </div>
        <div class="card-body">
            <p><small>Type: ${service.type}</small></p>
            <small>ID: ${service.thing_id}</small>
        </div>
    `;

    // 1. Add the Delete Logic
    const deleteBtn = node.querySelector('.delete-btn');
    deleteBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevents the drag logic from starting
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        node.remove(); // Removes the card from the canvas
        // If you later add lines/connections, call updateLines() here too
    });

    // 2. Add the Move Logic
    makeElementMovable(node);

    zone.appendChild(node);
}

function makeElementMovable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    el.onmousedown = (e) => {
        e = e || window.event;
        e.preventDefault();
        // Get the initial mouse position
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        // When mouse moves, run the move function
        document.onmousemove = (e) => {
            e = e || window.event;
            e.preventDefault();
            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Set the element's new position
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
        };

        // When mouse button is released, stop moving
        document.onmouseup = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
    };
}


/* INIT AND CLOSE RELATIONSHIP TABS */

function initRelationshipsTab() {
    console.log("Relationships initialized");
    const sorted = sortRelationships(mockRelationships);
    
    showRelationshipsLists(sorted.conditions, sorted.orders);
    renderDraggableServicesList();
    initDropZone();

    relationshipsInterval = setInterval(() => {
        console.log("updating things...");
        const update = sortRelationships(mockRelationships);
        showRelationshipsLists(update.conditions, update.orders);
    }, 2000);
    
}
function cleanupRelationshipsTab() {
    console.log("Relationships cleaned up");

    if(relationshipsInterval){
        clearInterval(relationshipsInterval);
        relationshipsInterval = null;
    }
}
