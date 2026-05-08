const tabMap = {
                "tabs/things/things.html": {
                    init: initThingsTab,
                    cleanup: cleanupThingsTab
                },
                "tabs/services/services.html": {
                    init: initServicesTab,
                    cleanup: cleanupServicesTab
                },
                "tabs/relationships/relationships.html": {
                    init: initRelationshipsTab,
                    cleanup: cleanupRelationshipsTab
                },
                "tabs/apps/apps.html": {
                    init: initAppsTab,
                    cleanup: cleanupAppsTab
                }
            };

let currentCleanup = null;

function loadTab(file) {
    const container = document.getElementById('main-content-area');

    // cleanup previous tab
    if (currentCleanup) {
        currentCleanup();
        currentCleanup = null;
    }

    fetch(file)
        .then(r => r.text())
        .then(data => {
            container.innerHTML = data;

            if (tabMap[file]) {
                tabMap[file].init();
                currentCleanup = tabMap[file].cleanup;
            }
        })
        .catch(err => {
            container.innerHTML = `<p style="color:red">${err.message}</p>`;
        });
}

function handleConnect(){

}

// initial load
window.onload = () => loadTab('tabs/things/things.html');



