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
    const isCondition = rel.condition && rel.condition.trim() !== "" && rel.condition.toUpperCase() !== "NULL";
    
    // 1. Dynamic color schemes based on the operational relationship logic
    const badgeBg = isCondition ? 'rgba(249, 115, 22, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    const badgeColor = isCondition ? '#fb923c' : '#60a5fa';
    const leftBorderColor = isCondition ? '#ea580c' : '#2563eb';

    return `
        <div class="iot-card rel-card" 
             style="background: #1e293b; border: 1px solid #334155; border-left: 4px solid ${leftBorderColor}; border-radius: 8px; margin-bottom: 16px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1); transition: transform 0.2s ease, box-shadow 0.2s ease;">
            
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(51, 65, 85, 0.5);">
                <span class="rel-type-tag" style="background: ${badgeBg}; color: ${badgeColor}; padding: 3px 8px; border-radius: 4px; font-size: 0.725em; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                    ${isCondition ? 'Condition Based' : 'Order Based'}
                </span>
                <span style="color: #64748b; font-size: 0.75em; font-family: monospace;">ID: ${rel.type.toLowerCase()}_chain</span>
            </div>

            <div class="card-body" style="display: flex; flex-direction: column; gap: 12px;">
                
                <div class="rel-flow" style="display: flex; align-items: center; justify-content: space-between; background: #0f172a; padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(51, 65, 85, 0.3);">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <span style="font-size: 0.7em; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Source Node</span>
                        <strong style="color: #f8fafc; font-size: 0.95em; font-weight: 600;">${rel.nameA}</strong>
                    </div>
                    
                    <div class="flow-arrow" style="color: ${badgeColor}; font-size: 1.35em; font-weight: bold; animation: pulse 2s infinite; padding: 0 8px;">
                        →
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 2px; text-align: right;">
                        <span style="font-size: 0.7em; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Target Outcome</span>
                        <strong style="color: #f8fafc; font-size: 0.95em; font-weight: 600;">${rel.nameB}</strong>
                    </div>
                </div>

                <div class="rel-logic" style="margin: 0; padding: 4px 2px; display: flex; align-items: center; gap: 6px;">
                    ${
                        isCondition
                            ? `<span style="color: #fb923c; font-weight: bold; font-size: 0.85em; font-family: monospace;">IF</span> 
                               <code style="background: #0f172a; color: #f43f5e; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; border: 1px solid rgba(244, 63, 94, 0.2); font-family: monospace; font-weight: 500;">${rel.condition}</code>`
                            : `<span style="color: #60a5fa; font-weight: bold; font-size: 0.85em; letter-spacing: 0.05em; font-family: monospace;">⚙ THEN RUN</span>`
                    }
                </div>
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