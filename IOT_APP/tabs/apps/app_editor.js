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

        const runtimeInputsA = get_service_input(nodeA);
        const runtimeInputsB = get_service_input(nodeB);

        const newRel = {
            id : typeof getID === 'function' ? getID() : Date.now(), 
            nameA: serviceA.service_name,
            nameB: serviceB.service_name,
            typeA: serviceA.type,
            typeB: serviceB.type,
            type: type,
            condition: condition,
            runtime_inputsA: runtimeInputsA,
            runtime_inputsB: runtimeInputsB
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

function getCanvasNodeHTML(service) {
    const inputKeys = Object.keys(service.inputs || {});
    const hasInputs = inputKeys.length > 0;

    // Build Inputs Badges
    let inputsHTML = '<span style="color: #64748b; font-style: italic;">None</span>';
    if (hasInputs) {
        inputsHTML = inputKeys.map(key => 
            `<span style="background: rgba(14, 165, 233, 0.15); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; margin: 2px; display: inline-block;"><strong>${key}:</strong> ${service.inputs[key]}</span>`
        ).join('');
    }

    // Build Outputs Badges
    let outputsHTML = '<span style="color: #64748b; font-style: italic;">None</span>';
    const outputKeys = Object.keys(service.outputs || {});
    if (outputKeys.length > 0) {
        outputsHTML = outputKeys.map(key => 
            `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; margin: 2px; display: inline-block;"><strong>${key}:</strong> ${service.outputs[key]}</span>`
        ).join('');
    }

    // Interactive Field Layout Map
    const inputFieldsHTML = inputKeys.map(key => {
        const currentRuntimeValue = (service.runtime_inputs && service.runtime_inputs[key]) !== undefined 
            ? service.runtime_inputs[key] 
            : '';
            
        return `
            <div style="margin-bottom: 8px; text-align: left;">
                <label style="display: block; font-size: 0.8em; color: #94a3b8; margin-bottom: 3px; font-weight: 500;">${key} (${service.inputs[key]})</label>
                <input type="text" 
                    class="canvas-node-input-field" 
                    data-input-key="${key}" 
                    value="${currentRuntimeValue}"
                    placeholder="Enter value" 
                    required
                    onchange="window.handleCanvasInputValueChange(this)"
                    onmousedown="event.stopPropagation()"
                    style="width: 100%; padding: 6px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #f8fafc; font-size: 0.85em; box-sizing: border-box; outline: none;">
            </div>
        `;
    }).join('');


    return `
        <div style="padding: 12px 12px 6px 12px;">
            <div class="card-header canvas-node-header" style="margin-bottom: 6px;">
                <strong style="color: #f8fafc; font-size: 1em; font-weight: 600;">
                    ${service.service_name}
                </strong>
            </div>
            <div class="card-body" style="color: #cbd5e1; font-size: 0.85em; line-height: 1.4;">
                <small style="display:block; margin-bottom: 2px;"><strong>Thing ID:</strong> ${service.thing_id || 'N/A'}</small>
            </div>
        </div>

        <div class="input-config-drawer" style="display: none; padding: 4px 12px 10px 12px; background: #111827; border-top: 1px solid #334155; font-size: 0.85em;">
            <p style="margin: 6px 0; color: #cbd5e1;"><strong>API Name:</strong> ${service.function_name || "None"}</p>
            <p style="margin: 4px 0; color: #94a3b8;"><strong>Expected Inputs:</strong> ${inputsHTML}</p>
            <p style="margin: 4px 0; color: #94a3b8; margin-bottom: 10px;"><strong>Outputs:</strong> ${outputsHTML}</p>
            ${hasInputs ? `<div class="inputs-form-container" style="border-top: 1px dashed #334155; padding-top: 8px; margin-top: 8px;">${inputFieldsHTML}</div>` : ''}
        </div>

        <div class="card-foot" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-top: 1px solid #334155; background: #1e293b; margin-top: auto;">
            <button class="set_input" onclick="window.handle_set_input(this)" title="Toggle Configuration View" 
                    style="background: #334155; color: #cbd5e1; border: 1px solid #475569; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8em; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin: 0;">
                ▼
            </button>
            <div class="node-actions" style="display: flex; flex-direction: row; gap: 6px; width: auto; max-width: none; overflow: visible;">
                <button class="connect-btn" title="Connect Relationship" style="display: inline-block; margin: 0;">🔗</button>
                <button class="delete-btn" title="Remove from canvas" style="display: inline-block; margin: 0;">×</button>
            </div>
        </div>
    `;
}

/* =====================================================
INPUT INTERACTION HANDLERS
===================================================== */
window.handleCanvasInputValueChange = function(inputElement) {
    if (inputElement) {
        inputElement.setAttribute('value', inputElement.value);
    }
};

window.handle_set_input = function(buttonElement) {
    const card = buttonElement.closest('.iot-card');
    const drawer = card.querySelector('.input-config-drawer');
    
    if (drawer) {
        const isHidden = drawer.style.display === 'none';
        drawer.style.display = isHidden ? 'block' : 'none';
        
        buttonElement.style.background = isHidden ? '#0284c7' : '#334155';
        buttonElement.style.color = isHidden ? '#ffffff' : '#cbd5e1';
        buttonElement.style.borderColor = isHidden ? '#0284c7' : '#475569';
        buttonElement.innerText = isHidden ? '▲' : '▼';
        
        // Redraw lines to ensure connection alignment stays fluid during height resize changes
        if (typeof drawConnections === 'function') {
            drawConnections();
        }
    }
};

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

/* ======================================================
BUTTONS ON NODES HANDLERS
========================================================= */

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
        const result = await showConnectionModal(sourceNode);
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
function showConnectionModal(sourceNode) {
    return new Promise((resolve) => {
        let availableOutputs = [];
        
        // 1. Correctly extract outputs from the Object map schema
        try {
            const payload = sourceNode.getAttribute('data-service');
            if (payload) {
                const serviceObj = JSON.parse(decodeURIComponent(atob(payload)));
                
                if (serviceObj.outputs && typeof serviceObj.outputs === 'object' && !Array.isArray(serviceObj.outputs)) {
                    // Extract keys out of the map layer (e.g. {"status": "string"} -> ["status"])
                    availableOutputs = Object.keys(serviceObj.outputs); 
                } else if (serviceObj.outputs && Array.isArray(serviceObj.outputs)) {
                    availableOutputs = serviceObj.outputs;
                } else if (serviceObj.output) {
                    availableOutputs = Array.isArray(serviceObj.output) ? serviceObj.output : [serviceObj.output];
                }
            }
        } catch (e) {
            console.error("[Modal Engine] Failed to parse source node metadata context:", e);
        }

        // Determine true validation capability
        const hasValidOutputs = availableOutputs.length > 0;

        // Fallback fallback string wrapper only for display completeness
        if (availableOutputs.length === 0) {
            availableOutputs = ["value"]; 
        }

        const overlay = createElement('div', 'modal-overlay');
        
        overlay.innerHTML = `
            <div class="connection-modal" style="max-width: 450px; padding: 20px; font-family: sans-serif;">
                <h3 style="margin-top: 0;">Select Connection Type</h3>
                
                <div class="modal-options-row" style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button class="modal-btn" id="btn-opt-order" style="flex: 1; padding: 10px; cursor: pointer;">Sequential Link (Order)</button>
                    <button class="modal-btn" id="btn-opt-condition-toggle" style="flex: 1; padding: 10px; cursor: pointer;">Conditional Trigger</button>
                </div>

                <div class="condition-builder-wrapper" id="condition-field-block" style="display: none; flex-direction: column; gap: 10px; background: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <label style="font-size: 13px; font-weight: bold; color: #555;">Define Trigger Rule:</label>
                    
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <select id="modal-cond-variable" style="flex: 1; padding: 8px; border-radius: 4px; border: 1px solid #ccc; min-width: 0;">
                            ${availableOutputs.map(out => `<option value="${out}">${out}</option>`).join('')}
                        </select>

                        <select id="modal-cond-operator" style="width: 70px; padding: 8px; border-radius: 4px; border: 1px solid #ccc; font-weight: bold; flex-shrink: 0;">
                            <option value="==">==</option>
                            <option value=">">&gt;</option>
                            <option value="<">&lt;</option>
                            <option value=">=">&gt;=</option>
                            <option value="<=">&lt;=</option>
                        </select>

                        <input type="text" id="modal-cond-value" placeholder="10, true, 'on'" style="flex: 1; min-width: 0; box-sizing: border-box; padding: 8px; border-radius: 4px; border: 1px solid #ccc;" />
                    </div>

                    <button class="modal-btn action-set-condition" id="btn-opt-set-condition" style="padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px;">
                        Save Rule Connection
                    </button>
                </div>

                <hr class="modal-divider" style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;" />
                <button class="modal-btn-cancel" id="btn-opt-cancel" style="width: 100%; padding: 8px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const condBlock = overlay.querySelector('#condition-field-block');
        const condToggleBtn = overlay.querySelector('#btn-opt-condition-toggle');
        const varSelect = overlay.querySelector('#modal-cond-variable');
        const opSelect = overlay.querySelector('#modal-cond-operator');
        const valInput = overlay.querySelector('#modal-cond-value');
        
        const closeModal = (value) => {
            overlay.remove();
            resolve(value); 
        };

        // Correctly handle blocking using our boolean check variable
        if (!hasValidOutputs) {
            condToggleBtn.disabled = true;
            condToggleBtn.style.opacity = '0.4';
            condToggleBtn.style.cursor = 'not-allowed';
            condToggleBtn.title = "This service returns no output parameters to validate conditions against.";
        }

        overlay.querySelector('#btn-opt-order').addEventListener('click', () => {
            closeModal({ type: CONNECTION_TYPES.ORDER, condition: null });
        });

        condToggleBtn.addEventListener('click', () => {
            if (condToggleBtn.disabled) return;
            condBlock.style.display = 'flex';
            valInput.focus();
        });

        overlay.querySelector('#btn-opt-set-condition').addEventListener('click', () => {
            const leftVar = varSelect.value;
            const operator = opSelect.value;
            let rightVal = valInput.value.trim();

            if (!rightVal) {
                valInput.style.borderColor = '#ff6b6b';
                return;
            }

            if (rightVal.toLowerCase() === 'true' || rightVal.toLowerCase() === 'false') {
                rightVal = rightVal.toLowerCase();
            } else if (isNaN(rightVal)) {
                const cleanStr = rightVal.replace(/['"]/g, '');
                rightVal = `"${cleanStr}"`;
            }

            const fullExpression = `${leftVar} ${operator} ${rightVal}`;

            closeModal({ 
                type: CONNECTION_TYPES.CONDITION, 
                condition: fullExpression 
            });
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
        if (event.target.closest('.node-actions') || event.target.closest('.set_input') || event.target.closest('.canvas-node-input-field')) return;
        
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
function get_service_input(node){
    if(!node) return null;

    const inputValues = {};
    const fields = node.querySelectorAll('.canvas-node-input-field');

    for(const field of fields){
        const key = field.getAttribute('data-input-key');

        if(!key){
            return null;
        }

        const value = field.value.trim();

        // Optional validation
        if(value === ''){
            return null;
        }

        inputValues[key] = value;
    }

    return inputValues;
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

    const zone = document.getElementById('drop-editor-zone');
    if (zone) {
        zone.querySelectorAll('.canvas-node').forEach(node => node.remove());
    }
    relationshipState.connections = [];
    relationshipState.spawnCounter = 0;

    const nameInput = document.getElementById("app_name");
    if (nameInput) {
        nameInput.value = app.name;
    }

    const createdNodesMap = {};
    
    const originX = 120;
    const originY = 120;
    const columnSpacing = 240;
    const rowSpacing = 160;
    const maxColumns = 3;
    let gridIndex = 0;

    const uniqueServices = new Map();

    if (app.services && Array.isArray(app.services)) {
        app.services.forEach(service => {
            const sName = service.service_name || service.name;
            if (sName && !uniqueServices.has(sName)) {
                uniqueServices.set(sName, service);
            }
        });
    }

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

    uniqueServices.forEach((serviceInfo) => {
        const posX = originX + (gridIndex % maxColumns) * columnSpacing;
        const posY = originY + Math.floor(gridIndex / maxColumns) * rowSpacing;

        const node = buildCanvasNode(serviceInfo, posX, posY);
        
        setupDeleteButton(node);
        setupConnectionButton(node);
        enableNodeDragging(node);

        if (zone && node) {
            zone.appendChild(node);
            createdNodesMap[serviceInfo.service_name] = node;
        }
        gridIndex++;
    });

    if (app.relationships && Array.isArray(app.relationships)) {
        app.relationships.forEach(rel => {
            const sourceNode = createdNodesMap[rel.nameA];
            const targetNode = createdNodesMap[rel.nameB];

            if (sourceNode && targetNode) {
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

    drawConnections();
    console.log(`[Canvas Engine] Render complete. Loaded ${gridIndex} nodes and ${relationshipState.connections.length} connections.`);
}

/* =====================================================
GLOBAL EXPORT
===================================================== */
window.renderDraggableServicesList = renderDraggableServicesList;
window.initDropZone = initDropZone;
window.onServiceDragStart = onServiceDragStart;
window.clearConnectionPaths = clearConnectionPaths;
window.show_application = show_application;