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
MOCK DATA FOR TESTING
====================================================== */
relationships.push(
    {
        id: 1,
        nameA: "Temperature Sensor",
        nameB: "Air Conditioner",
        typeA: "Sensor",
        typeB: "Actuator",
        type: "condition",
        condition: "value > 25"
    },
    {
        id: 2,
        nameA: "Humidity Sensor",
        nameB: "Dehumidifier",
        typeA: "Sensor",
        typeB: "Actuator",
        type: "condition",
        condition: "humidity >= 70%"
    },
    {
        id: 3,
        nameA: "Motion Detector",
        nameB: "Living Room Smart Light",
        typeA: "Sensor",
        typeB: "Actuator",
        type: "order",
        condition: null
    },
    {
        id: 4,
        nameA: "Main Door Lock",
        nameB: "Security Camera",
        typeA: "Sensor",
        typeB: "Actuator",
        type: "order",
        condition: null
    }
);

/* =====================================================
DOM HELPERS
===================================================== */

const $ = (id) => document.getElementById(id);

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