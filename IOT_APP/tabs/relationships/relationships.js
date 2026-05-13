/* =====================================================
RELATIONSHIP
====================================================== */
const relationships = [
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

function make_relationship(type, nodeA, nodeB, condition = null){
    try{
        const serviceA = JSON.parse(decodeURIComponent(atob(nodeA.getAttribute('data-service'))));
        const serviceB = JSON.parse(decodeURIComponent(atob(nodeB.getAttribute('data-service'))));

        const newRel = {
            nameA: serviceA.service_name,
            nameB: serviceB.service_name,
            typeA: serviceA.type,
            typeB: serviceB.type,
            type: type,
            condition: condition,
            status: "Active"
        };
        if (type === CONNECTION_TYPES.ORDER){
            newRel.condition = null;
        }
        return newRel;

    }catch(e){
        console.error("Invalid relationship parameters");
        return null;
    }
}

function add_relationship(newRel){
    if(!newRel) return;

    relationships.push(newRel);

    const sorted = sortRelationships(relationships);
    renderRelationshipLists(sorted.conditions, sorted.orders);
}

function remove_relationship(relId){
    const index = relationships.findIndex(r=> r.id === relId);
    if(index!==-1){
        relationships.splice(index,1);
        
        const sorted = sortRelationships(relationships);
        renderRelationshipLists(sorted.conditions, sorted.orders);
    }
    
}

/* =====================================================
STATE
===================================================== */

const SERVICE_TYPES = {
    SENSOR: 'Sensor',
    ACTUATOR: 'Actuator'
};

const CONNECTION_TYPES = {
    ORDER: 'order',
    CONDITION: 'condition'
};

const relationshipState = {
    interval: null,
    connectionSource: null,
    connections: [],
    spawnCounter: 0,
    isWaitingForModal: false
};


/* =====================================================
DOM HELPERS
===================================================== */

const $ = (id) => document.getElementById(id);

const createElement = (tag, className = '') => {
    const el = document.createElement(tag);

    if (className) {
        el.className = className;
    }

    return el;
};


/* =====================================================
RELATIONSHIP RENDERING
===================================================== */

function readRelationshipMessage() {
    // TODO
}

function getRelationshipCard(rel) {
    const isCondition = rel.condition !== null;

    return `
        <div class="iot-card rel-card">
            <div class="card-header">
                <span class="rel-type-tag">
                    ${rel.type.toUpperCase()}
                </span>

                <button
                    class="delete-btn"
                    title="Remove from relationship display"
                    onclick="remove_relationship('${rel.id}')"
                >
                    ×
                </button>
            </div>

            <div class="card-body">
                <div class="rel-flow">
                    <strong>${rel.nameA}</strong>

                    <span class="flow-arrow">→</span>

                    <strong>${rel.nameB}</strong>
                </div>

                <p class="rel-logic">
                    ${
                        isCondition
                            ? `IF <code>${rel.condition}</code>`
                            : 'THEN RUN'
                    }
                </p>
            </div>
        </div>
    `;
}

function sortRelationships(relationshipDataArray) {
    const sorter = (a, b) => a.nameA.localeCompare(b.nameA);

    const conditions = relationshipDataArray
        .filter(r => r.type.toLowerCase() === CONNECTION_TYPES.CONDITION)
        .sort(sorter);

    const orders = relationshipDataArray
        .filter(r => r.type.toLowerCase() === CONNECTION_TYPES.ORDER)
        .sort(sorter);

    return { conditions, orders };
}

function renderRelationshipLists(conditions, orders) {
    const conditionHTML = conditions
        .map(getRelationshipCard)
        .join('');

    const orderHTML = orders
        .map(getRelationshipCard)
        .join('');

    renderList(
        conditionHTML,
        'relationships-condition-based-container'
    );

    renderList(
        orderHTML,
        'relationships-order-based-container'
    );
}


/* =====================================================
SERVICE SIDEBAR
===================================================== */

function getDraggableServiceCard(service) {
    // Encode
    const payload = btoa(encodeURIComponent(JSON.stringify(service)));

    return `
        <div
            class="iot-card draggable-item"
            draggable="true"
            data-service='${payload}'
            ondragstart="onServiceDragStart(event)"
        >
            <div class="card-header">
                <h4 class="thing-title">
                    ${service.service_name}
                </h4>
            </div>
            <div class="card-body">
                <p class="metadata">
                    <strong>API:</strong>
                    ${service.API}
                </p>
            </div>
        </div>
    `;
}

function renderDraggableServicesList() {
    const container = $('things-editor-zone');

    if (!container) return;

    const sensors = mockServices.filter(
        service => service.type === SERVICE_TYPES.SENSOR
    );

    const actuators = mockServices.filter(
        service => service.type === SERVICE_TYPES.ACTUATOR
    );

    container.innerHTML = `
        ${createSidebarSection('SENSORS', sensors)}
        ${createSidebarSection('ACTUATORS', actuators)}
    `;
}

function createSidebarSection(title, items) {
    return `
        <div class="sidebar-section">
            <h5 class="sidebar-section-title">
                ${title}
            </h5>

            ${items.map(getDraggableServiceCard).join('')}
        </div>
    `;
}


/* =====================================================
DROP ZONE
===================================================== */

function initDropZone() {
    const zone = $('drop-editor-zone');

    zone.addEventListener('dragover', handleZoneDragOver);
    zone.addEventListener('drop', handleZoneDrop);
}

function handleZoneDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}

function handleZoneDrop(event) {
    event.preventDefault();

    const payload = event.dataTransfer.getData('text/plain');

    try {
        const decoded = decodeURIComponent(atob(payload));
        const service = JSON.parse(decoded);

        const zoneRect = $('drop-editor-zone')
            .getBoundingClientRect();

        const x = event.clientX - zoneRect.left;
        const y = event.clientY - zoneRect.top;

        createCanvasNode(service, x, y);

    } catch (error) {
        console.error(error);
    }
}


/* =====================================================
CANVAS NODES
===================================================== */

function createCanvasNode(service, x, y) {
    const node = buildCanvasNode(service, x, y);

    setupDeleteButton(node);
    setupConnectionButton(node);

    enableNodeDragging(node);

    $('drop-editor-zone').appendChild(node);
}

function buildCanvasNode(service, x, y) {
    const node = createElement('div');

    const offset = getSpawnOffset();

    const payload = btoa(encodeURIComponent(JSON.stringify(service)));
    node.setAttribute('data-service', payload);

    node.className = getNodeClass(service);

    setNodePosition(
        node,
        x + offset,
        y + offset
    );

    node.innerHTML = getCanvasNodeHTML(service);

    return node;
}

function getSpawnOffset() {
    const offset = (relationshipState.spawnCounter % 5) * 10;

    relationshipState.spawnCounter++;

    return offset;
}

function getNodeClass(service) {
    const typeClass =
        service.type === SERVICE_TYPES.ACTUATOR
            ? 'actuator-node'
            : 'sensor-node';

    return `iot-card canvas-node ${typeClass}`;
}

function setNodePosition(node, x, y) {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
}

function getCanvasNodeHTML(service) {
    return `
        <div class="card-header canvas-node-header">
            <strong>${service.service_name}</strong>

            <div class="node-actions">
                <button
                    class="connect-btn"
                    title="Connect Relationship"
                >
                    🔗
                </button>

                <button
                    class="delete-btn"
                    title="Remove from canvas"
                >
                    ×
                </button>
            </div>
        </div>
        <div class="card-body">
            <small>ID: ${service.thing_id}</small>
        </div>
    `;
}

function setupDeleteButton(node) {
    const deleteBtn = node.querySelector('.delete-btn');

    deleteBtn.addEventListener('mousedown', stopEvent);

    deleteBtn.addEventListener('click', (event) => {
        stopEvent(event);

        node.remove();

        relationshipState.connections =
            relationshipState.connections.filter(
                connection =>
                    connection.from !== node &&
                    connection.to !== node
            );

        drawConnections();
    });
}

function setupConnectionButton(node) {
    const connectBtn = node.querySelector('.connect-btn');

    connectBtn.addEventListener('click', (event) => {
        stopEvent(event);
        handleNodeConnectionClick(node);
    });
}

function stopEvent(event) {
    event.stopPropagation();
}

async function handleNodeConnectionClick(targetNode) {

    if (!relationshipState.connectionSource) {

        relationshipState.connectionSource = targetNode;

        targetNode.style.outline =
            '2px dashed var(--accent-color)';

        console.log(
            'Source selected. Click another node to connect.'
        );

        return;
    }

    if (relationshipState.connectionSource === targetNode) {

        relationshipState.connectionSource.style.outline = 'none';

        relationshipState.connectionSource = null;

        return;
    }

    const sourceNode = relationshipState.connectionSource;

    relationshipState.isWaitingForModal = true;

    try{
        const result = await showConnectionModal();
        if(result){
            console.log("Adding connection:", result);
            const newRel = make_relationship(result.type, sourceNode, targetNode, result.condition);
            add_relationship(newRel);

            relationshipState.connections.push({
                from: sourceNode,
                to: targetNode,
                type: result.type,
            });
            drawConnections();
        }
    }
    finally{
        if (sourceNode) sourceNode.style.outline = 'none';
        relationshipState.connectionSource = null;
        relationshipState.isWaitingForModal = false;

        drawConnections();
    }

}

/* =====================================================
NODE MOVEMENT
===================================================== */

function enableNodeDragging(node) {

    let mouseX = 0;
    let mouseY = 0;

    let deltaX = 0;
    let deltaY = 0;

    node.addEventListener('mousedown', startDragging);

    function startDragging(event) {

        event.preventDefault();

        mouseX = event.clientX;
        mouseY = event.clientY;

        document.addEventListener('mousemove', dragNode);
        document.addEventListener('mouseup', stopDragging);
    }

    function dragNode(event) {

        event.preventDefault();

        deltaX = mouseX - event.clientX;
        deltaY = mouseY - event.clientY;

        mouseX = event.clientX;
        mouseY = event.clientY;

        node.style.top =
            `${node.offsetTop - deltaY}px`;

        node.style.left =
            `${node.offsetLeft - deltaX}px`;

        drawConnections();
    }

    function stopDragging() {
        document.removeEventListener(
            'mousemove',
            dragNode
        );

        document.removeEventListener(
            'mouseup',
            stopDragging
        );
    }
}


/* =====================================================
CONNECTIONS
===================================================== */

function drawConnections() {
    clearConnectionPaths();

    relationshipState.connections.forEach(
        drawConnection
    );
}

function clearConnectionPaths() {
    $('canvas-connections')
        .querySelectorAll('path')
        .forEach(path => path.remove());
}

function drawConnection(connection) {

    const path = createConnectionPath(connection);

    $('canvas-connections').appendChild(path);
}

function createConnectionPath(connection) {

    const zoneRect = $('drop-editor-zone')
        .getBoundingClientRect();

    const from = getNodeCenter(
        connection.from,
        zoneRect
    );

    const to = getNodeCenter(
        connection.to,
        zoneRect
    );

    const path = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
    );

    const dx = Math.abs(from.x - to.x) * 0.5;

    const d = `
        M ${from.x} ${from.y}
        C ${from.x + dx} ${from.y},
          ${to.x - dx} ${to.y},
          ${to.x} ${to.y}
    `;

    path.setAttribute('d', d);

    path.setAttribute(
        'stroke',
        connection.type === CONNECTION_TYPES.ORDER
            ? 'var(--accent-color)'
            : 'var(--outline-sensor-service-in-zone)'
    );

    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrowhead)');

    if (connection.type === CONNECTION_TYPES.CONDITION) {
        path.setAttribute('stroke-dasharray', '8,4');
    }

    return path;
}

function getNodeCenter(node, zoneRect) {

    const rect = node.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2 - zoneRect.left,
        y: rect.top + rect.height / 2 - zoneRect.top
    };
}


/* =====================================================
TAB LIFECYCLE
===================================================== */

function initRelationshipsTab() {

    console.log('Relationships initialized');

    const sorted = sortRelationships(
        relationships
    );

    renderRelationshipLists(
        sorted.conditions,
        sorted.orders
    );

    renderDraggableServicesList();

    initDropZone();

    relationshipState.interval = setInterval(() => {

        console.log('Updating relationships...');

        const updated = sortRelationships(
            relationships
        );

        renderRelationshipLists(
            updated.conditions,
            updated.orders
        );

    }, 2000);
}

function cleanupRelationshipsTab() {

    console.log('Relationships cleaned up');

    if (relationshipState.interval) {

        clearInterval(
            relationshipState.interval
        );

        relationshipState.interval = null;
    }
}

