/*
====================================
CURRENT APP
====================================
*/

const apps = [];

let currentApp = {
    name: "",
    filename: "",
    finalized: false,
    steps: []
};


apps.push({name:"applicazion1"});

/*
====================================
INIT TAB
====================================
*/

function initAppsTab() {

    console.log("Apps initialized");

    // 1. Mostra la lista dei sensori e attuatori sulla sinistra
    if (typeof renderDraggableServicesList === 'function') {
        renderDraggableServicesList();
    }

    // 2. Attiva la Drop Zone per accettare il drag & drop
    if (typeof initDropZone === 'function') {
        initDropZone();
    }

    // 3. Renderizza la lista delle App salvate in alto
    if (typeof renderAppsList === 'function') {
        renderAppsList();
    }
}


/*
====================================
CLEANUP
====================================
*/

function cleanupAppsTab() {
    console.log("Apps cleaned up");
    if (typeof clearConnectionPaths === 'function') {
        clearConnectionPaths();
    }
}

/*
====================================

SHOW APP 

====================================
*/

function getAppCard(app){
    return `
        <div class="iot-card thing-variant">
            <div class="card-header">
                <h4 class="thing-title">${app.name}</h4>
            </div>
            <div class="card-body">
                <button class="activate_app_button" title="runs selected app" on_click="run_app"> |> </button>
                <button class="stop_app_button" title="stops selected app" on_click="stop_app"> || </button>
                <button class="delete_app_button" title="deletes selected app" on_click="delete_app"> X </button>
            </div>
        </div>
    `;
}


function renderAppsList(){
    // Usiamo il selettore nativo per evitare conflitti con la macro $
    const savedAppsContainer = document.getElementById('saved-apps-container');

    if (savedAppsContainer) {
        savedAppsContainer.innerHTML = apps.map(getAppCard).join('');
    }
}

/*
===========================================
APP MANAGER FUNCTIONS
===========================================
*/


function run_app(){

}

function stop_app(){

}

function delete_app(){

}


/* 
==========================================
GLOBAL EXPORT
===========================================
*/


window.initAppsTab =
    initAppsTab;

window.cleanupAppsTab =
    cleanupAppsTab;




