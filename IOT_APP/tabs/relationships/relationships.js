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

function initRelationshipsTab() {
    console.log("Relationships initialized");
    const sorted = sortRelationships(mockRelationships);
    
    showRelationshipsLists(sorted.conditions, sorted.orders);

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