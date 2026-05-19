const APPS_KEY = "atlas_apps";

/*
====================================
SAVE APP
====================================
*/

function saveApp(app) {

    let apps = JSON.parse(
        localStorage.getItem(APPS_KEY)
    ) || [];

    const existingIndex = apps.findIndex(
        a => a.name === app.name
    );

    if (existingIndex >= 0) {
        apps[existingIndex] = app;
    }
    else {
        apps.push(app);
    }

    localStorage.setItem(
        APPS_KEY,
        JSON.stringify(apps)
    );
}

/*
====================================
LOAD APPS
====================================
*/

function loadApps() {

    return JSON.parse(
        localStorage.getItem(APPS_KEY)
    ) || [];
}

/*
====================================
DELETE APP
====================================
*/

function deleteApp(appName) {

    let apps = loadApps();

    apps = apps.filter(
        a => a.name !== appName
    );

    localStorage.setItem(
        APPS_KEY,
        JSON.stringify(apps)
    );
}

/*
====================================
EXPORTS
====================================
*/

window.saveApp = saveApp;
window.loadApps = loadApps;
window.deleteApp = deleteApp;

console.log("app_storage loaded", window.loadApps);