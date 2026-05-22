/* =====================================================
STATE & CONFIGURATION
===================================================== */

const SERVICE_TYPES = {
    SENSOR: 'Sensor',
    ACTUATOR: 'Actuator'
};

if (typeof CONNECTION_TYPES === 'undefined') {
    window.CONNECTION_TYPES = {
        ORDER: 'order',
        CONDITION: 'condition'
    };
}

const relationshipState = {
    interval: null,
    connectionSource: null,
    connections: [],
    spawnCounter: 0,
    isWaitingForModal: false
};

/* =====================================================
DOM HELPERS (PROTETTO DA CONFLITTI)
===================================================== */
if (typeof $ === 'undefined') {
    window.$ = (id) => document.getElementById(id);
}

const createElement = (tag, className = '') => {
    const el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    return el;
};

/* =====================================================
RELATIONSHIP BUILDER ENGINE
====================================================== */

function make_relationship(type, nodeA, nodeB, condition = null){
    try {
        const serviceA = JSON.parse(decodeURIComponent(atob(nodeA.getAttribute('data-service'))));
        const serviceB = JSON.parse(decodeURIComponent(atob(nodeB.getAttribute('data-service'))));

        const newRel = {
            id : typeof getID === 'function' ? getID() : Date.now(), 
            nameA: serviceA.service_name,
            nameB: serviceB.service_name,
            typeA: serviceA.type,
            typeB: serviceB.type,
            type: type,
            condition: condition
        };
        if (type === CONNECTION_TYPES.ORDER){
            newRel.condition = null;
        }
        return newRel;

    } catch(e) {
        console.error("Invalid relationship parameters", e);
        return null;
    }
}

/* =====================================================
SERVICE SIDEBAR & DRAG EVENTS
===================================================== */

function onServiceDragStart(event) {
    const payload = event.currentTarget.getAttribute('data-service');
    event.dataTransfer.setData('text/plain', payload);
    event.dataTransfer.dropEffect = 'copy';
}

function getDraggableServiceCard(service) {
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
                    <strong> service ID:</strong>
                    ${service.service_id}
                </p>
                <p class="metadata">
                    <strong> thing ID:</strong>
                    ${service.thing_id}
                </p>
                
            </div>
        </div>
    `;
}

function renderDraggableServicesList() {
    const container = document.getElementById('things-editor-zone');
    if (!container) return;

    const availableServices = typeof services !== 'undefined' ? services : [];

    const onlineServices = availableServices.filter(service => 
        service.status && service.status.toLowerCase() === "active"
    );

    const sensors = onlineServices.filter(service => {
        const type = (service.type || "").toLowerCase();
        return type === "sensor" || type === "report";
    });

    const actuators = onlineServices.filter(service => {
        const type = (service.type || "").toLowerCase();
        return type === "actuator" || type === "action";
    });

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
DROP ZONE DRAG-AND-DROP HANDLERS
===================================================== */

function initDropZone() {
    const zone = document.getElementById('drop-editor-zone');
    if (!zone) return;

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

        const zoneRect = document.getElementById('drop-editor-zone').getBoundingClientRect();
        const x = event.clientX - zoneRect.left;
        const y = event.clientY - zoneRect.top;

        createCanvasNode(service, x, y);

    } catch (error) {
        console.error("Error drop processing:", error);
    }
}

/* =====================================================
CANVAS NODES MANAGEMENT
===================================================== */

function createCanvasNode(service, x, y) {
    const node = buildCanvasNode(service, x, y);

    setupDeleteButton(node);
    setupConnectionButton(node);
    enableNodeDragging(node);

    document.getElementById('drop-editor-zone').appendChild(node);
}

function buildCanvasNode(service, x, y) {
    const node = createElement('div');
    const offset = getSpawnOffset();
    const payload = btoa(encodeURIComponent(JSON.stringify(service)));
    
    node.setAttribute('data-service', payload);
    node.className = getNodeClass(service);

    setNodePosition(node, x + offset, y + offset);
    node.innerHTML = getCanvasNodeHTML(service);

    return node;
}

function getSpawnOffset() {
    const offset = (relationshipState.spawnCounter % 5) * 10;
    relationshipState.spawnCounter++;
    return offset;
}

function getNodeClass(service) {
    const type = (service.type || "").toLowerCase();
    const isActuator = type === "actuator" || type === "action";
    return `iot-card canvas-node ${isActuator ? 'actuator-node' : 'sensor-node'}`;
}

function setNodePosition(node, x, y) {
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
}

// Replace this function in app_editor.js
function getCanvasNodeHTML(service) {
    const inputKeys = Object.keys(service.inputs || {});
    const hasInputs = inputKeys.length > 0;

    let inputsFormHTML = '';
    if (hasInputs) {
        inputsFormHTML = `
            <div class="canvas-node-inputs-block" style="margin-top: 8px; border-top: 1px dashed #334155; padding-top: 6px;">
                ${inputKeys.map(key => {
                    // Pull the already configured runtime value if reloading a saved app architecture
                    const currentRuntimeValue = (service.runtime_inputs && service.runtime_inputs[key]) !== undefined 
                        ? service.runtime_inputs[key] 
                        : '';
                        
                    return `
                        <div style="margin-bottom: 4px; text-align: left;">
                            <label style="font-size: 0.75em; color: #94a3b8; display:block; margin-bottom:1px;">${key}:</label>
                            <input type="text" 
                                   class="canvas-node-input-field" 
                                   data-input-key="${key}" 
                                   value="${currentRuntimeValue}"
                                   placeholder="Value..." 
                                   onchange="window.handleCanvasInputValueChange(this)"
                                   onmousedown="event.stopPropagation()"
                                   style="width: 100%; padding: 4px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #f8fafc; font-size: 0.8em; box-sizing: border-box; outline: none;">
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    return `
        <div class="card-header canvas-node-header" style="padding-bottom: 2px;">
            <strong>${service.service_name}</strong>
            <div class="node-actions">
                <button class="connect-btn" title="Connect Relationship">🔗</button>
                <button class="delete-btn" title="Remove from canvas">×</button>
            </div>
        </div>
        <div class="card-body" style="padding-top: 2px;">
            <small style="color: #64748b; display: block; margin-bottom: 2px;">ID: ${service.thing_id || service.id || 'N/A'}</small>
            ${inputsFormHTML}
        </div>
    `;
}

function setupDeleteButton(node) {
    const deleteBtn = node.querySelector('.delete-btn');
    deleteBtn.addEventListener('mousedown', stopEvent);

    deleteBtn.addEventListener('click', (event) => {
        stopEvent(event);
        node.remove();

        relationshipState.connections = relationshipState.connections.filter(
            connection => connection.from !== node && connection.to !== node
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
        targetNode.style.outline = '2px dashed var(--accent-color)';
        console.log('Source selected. Click another node to connect.');
        return;
    }

    if (relationshipState.connectionSource === targetNode) {
        relationshipState.connectionSource.style.outline = 'none';
        relationshipState.connectionSource = null;
        return;
    }

    const sourceNode = relationshipState.connectionSource;
    relationshipState.isWaitingForModal = true;

    try {
        const result = await showConnectionModal();
        if (result) {
            relationshipState.connections.push({
                from: sourceNode,
                to: targetNode,
                type: result.type,
                condition: result.condition 
            });
            drawConnections();
        }
    } finally {
        if (sourceNode) sourceNode.style.outline = 'none';
        relationshipState.connectionSource = null;
        relationshipState.isWaitingForModal = false;
        drawConnections();
    }
}

/* =====================================================
MODAL LOGIC
====================================================== */

function showConnectionModal() {
    return new Promise((resolve) => {
        const overlay = createElement('div', 'modal-overlay');
        
        overlay.innerHTML = `
            <div class="connection-modal">
                <h3>Select Connection Type</h3>
                <div class="modal-options-row">
                    <button class="modal-btn" id="btn-opt-order">Order Based</button>
                    <button class="modal-btn" id="btn-opt-condition-toggle">Condition Based</button>
                </div>
                <div class="condition-input-wrapper" id="condition-field-block" style="display: none;">
                    <input type="text" class="modal-input" id="modal-cond-text" placeholder="e.g. value > 10" />
                    <button class="modal-btn action-set-condition" id="btn-opt-set-condition">Set Condition</button>
                </div>
                <hr class="modal-divider" />
                <button class="modal-btn-cancel" id="btn-opt-cancel">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const condBlock = overlay.querySelector('#condition-field-block');
        const condInput = overlay.querySelector('#modal-cond-text');
        
        const closeModal = (value) => {
            overlay.remove();
            resolve(value); 
        };

        overlay.querySelector('#btn-opt-order').addEventListener('click', () => {
            closeModal({ type: CONNECTION_TYPES.ORDER, condition: null });
        });

        overlay.querySelector('#btn-opt-condition-toggle').addEventListener('click', () => {
            condBlock.style.display = 'flex';
            condInput.focus();
        });

        overlay.querySelector('#btn-opt-set-condition').addEventListener('click', () => {
            const expression = condInput.value.trim();
            if (!expression) {
                condInput.style.borderColor = '#ff6b6b';
                return;
            }
            closeModal({ type: CONNECTION_TYPES.CONDITION, condition: expression });
        });

        overlay.querySelector('#btn-opt-cancel').addEventListener('click', () => closeModal(null));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(null); });
    });
}

/* =====================================================
NODE INTERACTIVE DRAGGING (CANVAS)
===================================================== */

function enableNodeDragging(node) {
    let mouseX = 0;
    let mouseY = 0;
    let deltaX = 0;
    let deltaY = 0;

    node.addEventListener('mousedown', startDragging);

    function startDragging(event) {
        if (event.target.closest('.node-actions')) return;
        
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

        node.style.top = `${node.offsetTop - deltaY}px`;
        node.style.left = `${node.offsetLeft - deltaX}px`;

        drawConnections();
    }

    function stopDragging() {
        document.removeEventListener('mousemove', dragNode);
        document.removeEventListener('mouseup', stopDragging);
    }
}

/* =====================================================
SVG CONNECTIONS DRAWER
===================================================== */

function drawConnections() {
    clearConnectionPaths();
    relationshipState.connections.forEach(drawConnection);
}

function clearConnectionPaths() {
    const svg = document.getElementById('canvas-connections');
    if (svg) {
        svg.querySelectorAll('path').forEach(path => path.remove());
    }
}

function drawConnection(connection) {
    const path = createConnectionPath(connection);
    const svg = document.getElementById('canvas-connections');
    if (svg && path) svg.appendChild(path);
}

function createConnectionPath(connection) {
    const zone = document.getElementById('drop-editor-zone');
    if (!zone) return null;
    
    const zoneRect = zone.getBoundingClientRect();
    const from = getNodeCenter(connection.from, zoneRect);
    const to = getNodeCenter(connection.to, zoneRect);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
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
            ? 'var(--accent-color, #007bff)'
            : 'var(--outline-sensor-service-in-zone, #28a745)'
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
CANVAS ACTIONS (SAVE / CLEAR)
===================================================== */


function submit_relationships() {
    if (relationshipState.connections.length === 0) {
        console.warn("No new connections to submit.");
        return;
    }

    if (typeof relationships !== 'undefined') {
        relationshipState.connections.forEach(conn => {
            const newRel = make_relationship(
                conn.type, 
                conn.from, 
                conn.to, 
                conn.condition
            );

            if (newRel) {
                relationships.push(newRel);
            }
        });
        console.log("Relationships saved to global state.");
    } else {
        console.error("Global 'relationships' array not found.");
    }

    execute_canvas_reset();

    const zone = document.getElementById('drop-editor-zone');
    if (zone) {
        zone.querySelectorAll('.canvas-node').forEach(node => node.remove());
    }
    
    relationshipState.connections = [];
    relationshipState.spawnCounter = 0;
    drawConnections();

    if(document.getElementById('app_name')) document.getElementById('app_name').value = '';
}

function clear_canvas() {
    if (confirm("Are you sure you want to discard all unsaved connections?")) {
        const zone = document.getElementById('drop-editor-zone');
        if (zone) {
            zone.querySelectorAll('.canvas-node').forEach(node => node.remove());
        }
        
        relationshipState.connections = [];
        relationshipState.spawnCounter = 0;
        drawConnections();
        
        console.log("Canvas cleared without saving.");
    }
}

/* =====================================================
SHOW APP
===================================================== */
function show_application(app) {
    if (!app) {
        console.error("[Canvas Engine] Cannot open app: payload context is empty.");
        return;
    }

    console.log(`[Canvas Engine] Rendering app topology for: "${app.name}"`);

    // 1. CLEAR WORKSPACE CANVAS CLEANLY
    const zone = document.getElementById('drop-editor-zone');
    if (zone) {
        zone.querySelectorAll('.canvas-node').forEach(node => node.remove());
    }
    relationshipState.connections = [];
    relationshipState.spawnCounter = 0;

    // 2. SYNCHRONIZE HEAD TITLE FIELD TEXT INPUT
    const nameInput = document.getElementById("app_name");
    if (nameInput) {
        nameInput.value = app.name;
    }

    // This tracking dictionary maps a service name string to its actual DOM Node reference
    const createdNodesMap = {};
    
    // Grid configuration geometry to spread elements logically across the editor zone canvas
    const originX = 120;
    const originY = 120;
    const columnSpacing = 240;
    const rowSpacing = 160;
    const maxColumns = 3;
    let gridIndex = 0;

    // 3. EXTRACT AND COLLECT DISTINCT SERVICE DEFINITIONS
    const uniqueServices = new Map();

    // Collect from the services array backup block first
    if (app.services && Array.isArray(app.services)) {
        app.services.forEach(service => {
            const sName = service.service_name || service.name;
            if (sName && !uniqueServices.has(sName)) {
                uniqueServices.set(sName, service);
            }
        });
    }

    // Cross-verify with relationship structures to ensure zero orphans are missed
    if (app.relationships && Array.isArray(app.relationships)) {
        app.relationships.forEach(rel => {
            if (!uniqueServices.has(rel.nameA)) {
                uniqueServices.set(rel.nameA, { service_name: rel.nameA, type: rel.typeA });
            }
            if (!uniqueServices.has(rel.nameB)) {
                uniqueServices.set(rel.nameB, { service_name: rel.nameB, type: rel.typeB });
            }
        });
    }

    // 4. GENERATE AND ATTACH VISUAL HTML CARD NODES
    uniqueServices.forEach((serviceInfo) => {
        // Compute position index coordinates dynamically
        const posX = originX + (gridIndex % maxColumns) * columnSpacing;
        const posY = originY + Math.floor(gridIndex / maxColumns) * rowSpacing;

        // Build the physical DOM structural node object using your asset generation suite
        const node = buildCanvasNode(serviceInfo, posX, posY);
        
        // Wire back interactive listener capabilities exactly like live drops
        setupDeleteButton(node);
        setupConnectionButton(node);
        enableNodeDragging(node);

        if (zone && node) {
            zone.appendChild(node);
            
            // Critical Step: Store reference handle linked by service name identifier text
            createdNodesMap[serviceInfo.service_name] = node;
        }
        gridIndex++;
    });

    // 5. RESTORE INTER-NODE RELATIONSHIP PATH LINKS
    if (app.relationships && Array.isArray(app.relationships)) {
        app.relationships.forEach(rel => {
            const sourceNode = createdNodesMap[rel.nameA];
            const targetNode = createdNodesMap[rel.nameB];

            if (sourceNode && targetNode) {
                // Register tracking record to core layout pipeline engine
                relationshipState.connections.push({
                    from: sourceNode,
                    to: targetNode,
                    type: rel.type,
                    condition: rel.condition
                });
            } else {
                console.warn(`[Canvas Engine] Missing connection node anchors. A: ${!!sourceNode}, B: ${!!targetNode}`);
            }
        });
    }

    // 6. RENDER CONNECTION SPLINES ON SVG LAYER
    drawConnections();
    console.log(`[Canvas Engine] Render complete. Loaded ${gridIndex} nodes and ${relationshipState.connections.length} connections.`);
}

/* =====================================================
GLOBAL EXPORT (Make sure show_application is here!)
===================================================== */
window.renderDraggableServicesList = renderDraggableServicesList;
window.initDropZone = initDropZone;
window.onServiceDragStart = onServiceDragStart;
window.clearConnectionPaths = clearConnectionPaths;
window.show_application = show_application; // <-- THIS EXPORTS IT GLOBALLY
