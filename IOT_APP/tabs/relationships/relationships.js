/* =====================================================
STATE & CONFIGURATION
====================================================== */

// Array globale che contiene le relazioni salvate (struttura dati principale)
const relationships = [];
const deletedIDs = [];

const CONNECTION_TYPES = {
    ORDER: 'order',
    CONDITION: 'condition'
};


/* =====================================================
DOM HELPERS
===================================================== */

const $ = (id) => document.getElementById(id);



/* =====================================================
RELATIONSHIPS READING
===================================================== */

function readRelationshipMessage(tweet){
    if(!tweet) return;

    const serviceA = tweet['FS name'];
    const serviceB = tweet['SS name'];
    const type = tweet['Type'];
    const condition = tweet['Description']; // Capital 'D' from Atlas C++ code

    // Fixed Guard: 'condition' shouldn't be mandatory since 'order' types might not have it
    if(!serviceA || !serviceB || !type){
        console.log("received an invalid relationship");
        return;
    }

    // 1. Declare placeholders first so they can be updated
    let determinedTypeA = "ServiceTypeA";
    let determinedTypeB = "ServiceTypeB";

    // 2. Cross-reference with your services array if available
    if (typeof services !== 'undefined' && Array.isArray(services)) {
        const foundA = services.find(s => s.name === serviceA);
        const foundB = services.find(s => s.name === serviceB);
        
        if (foundA && foundA.type) determinedTypeA = foundA.type;
        if (foundB && foundB.type) determinedTypeB = foundB.type;
    }

    // 3. Normalize the relationship type (Fixed: referencing 'type' safely)
    const rawType = type.toLowerCase();
    let resolvedType = CONNECTION_TYPES.CONDITION;
    if(rawType.includes('order') || rawType === 'sequence' || rawType === 'control'){
        resolvedType = CONNECTION_TYPES.ORDER;
    }

    // 4. Calculate final condition (Fixed: using 'condition' variable)
    const finalCondition = resolvedType === CONNECTION_TYPES.CONDITION ? (condition || "true") : null;

    // 5. Construct the final object mapping (Omitted ID as requested)
    const rel = {
        nameA : serviceA, 
        nameB : serviceB, 
        typeA : determinedTypeA,
        typeB : determinedTypeB, 
        type : resolvedType, 
        condition : finalCondition // Fixed: Using your smart finalCondition variable
    };

    // 6. Duplicate checking loop
    const isDuplicate = relationships.some(existing => 
        existing.nameA === rel.nameA && 
        existing.nameB === rel.nameB && 
        existing.type === rel.type &&
        existing.condition === rel.condition
    );

    if(isDuplicate){
        return;
    }

    // 7. Update state array and UI containers
    relationships.push(rel);
    const sorted = sortRelationships(relationships);
    renderRelationshipLists(sorted.conditions, sorted.orders);
}

/* =====================================================
RELATIONSHIP CORE FUNCTIONS
====================================================== */

function getID() {
    if (deletedIDs.length > 0) {
        deletedIDs.sort((a, b) => a - b);
        return deletedIDs.shift();
    }
    const maxID = relationships.reduce((max, r) => Math.max(max, r.id), 0);
    return maxID + 1;
}


/* =====================================================
RELATIONSHIP RENDERING
===================================================== */

function getRelationshipCard(rel) {
    const isCondition = rel.condition !== null;

    return `
        <div class="iot-card rel-card">
            <div class="card-header">
                <span class="rel-type-tag">
                    ${rel.type.toUpperCase()}
                </span>

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
    const conditionContainer = $('relationships-condition-based-container');
    const orderContainer = $('relationships-order-based-container');

    if (conditionContainer) {
        conditionContainer.innerHTML = conditions.map(getRelationshipCard).join('');
    }

    if (orderContainer) {
        orderContainer.innerHTML = orders.map(getRelationshipCard).join('');
    }
}

/* =====================================================
TAB LIFECYCLE
===================================================== */

function initRelationshipsTab() {
    console.log('Relationships tab initialized in read-only mode');

    const sorted = sortRelationships(relationships);
    renderRelationshipLists(sorted.conditions, sorted.orders);
}

function cleanupRelationshipsTab() {
    console.log('Relationships tab cleaned up');
}

// Esporta le funzioni per il gestore dei tab globale (se necessario)
window.initRelationshipsTab = initRelationshipsTab;
window.cleanupRelationshipsTab = cleanupRelationshipsTab;