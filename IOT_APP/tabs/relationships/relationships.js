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
        const payload = e.dataTransfer.getData("application/json");
        if (!payload) return;

        const service = JSON.parse(atob(payload));
        
        // Calculate Drop Position
        const rect = zone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        spawnNodeInCanvas(service, x, y);
    });
}

/* DROP EDITOR ZONE  */

function spawnNodeInCanvas(service, x, y) {
    const zone = document.getElementById('drop-editor-zone');
    const node = document.createElement('div');
    
    // Style it so it actually appears at the drop coordinates
    node.className = 'iot-card canvas-node';
    node.style.position = 'absolute';
    node.style.left = (x - 50) + 'px'; // Offset by half-width so mouse is center
    node.style.top = (y - 20) + 'px';
    node.style.width = '180px';
    node.style.zIndex = '100';

    node.innerHTML = `
        <div style="padding: 5px; font-size: 12px;">
            <strong>${service.service_name}</strong>
        </div>
    `;

    zone.appendChild(node);
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
