/*
====================================
CURRENT APP
====================================
*/

let currentApp = {
    name: "",
    filename: "",
    finalized: false,
    steps: []
};

/*
====================================
INIT TAB
====================================
*/

function initAppsTab() {

    console.log("Apps initialized");

    const editor =
        document.getElementById(
            "app-editor"
        );

    /*
    -------------------------
    DRAG OVER
    -------------------------
    */

    editor.addEventListener(
        "dragover",
        (e) => {
            e.preventDefault();
        }
    );

    /*
    -------------------------
    DROP SERVICE
    -------------------------
    */

    editor.addEventListener(
        "drop",
        (e) => {

            e.preventDefault();

            const payload =
                e.dataTransfer.getData(
                    "text/plain"
                );

            const service =
                JSON.parse(
                    atob(payload)
                );

            currentApp.steps.push({

                type: "service",

                thing: service.thing,

                service: service.name
            });

            renderEditor();
        }
    );

    /*
    -------------------------
    BUTTONS
    -------------------------
    */

    document
        .getElementById(
            "save-app-btn"
        )
        .addEventListener(
            "click",
            saveCurrentApp
        );

    document
        .getElementById(
            "finalize-app-btn"
        )
        .addEventListener(
            "click",
            finalizeCurrentApp
        );

    document
        .getElementById(
            "clear-app-btn"
        )
        .addEventListener(
            "click",
            clearEditor
        );

    document
        .getElementById(
            "new-app-btn"
        )
        .addEventListener(
            "click",
            clearEditor
        );

    /*
    -------------------------
    RELATIONSHIPS
    -------------------------
    */

    document
        .getElementById(
            "add-order-btn"
        )
        .addEventListener(
            "click",
            addOrderRelationship
        );

    document
        .getElementById(
            "add-condition-btn"
        )
        .addEventListener(
            "click",
            addConditionRelationship
        );

    /*
    -------------------------
    INITIAL APP LIST
    -------------------------
    */

    renderAppsList();
}

/*
====================================
CLEANUP
====================================
*/

function cleanupAppsTab() {
    console.log("Apps cleaned up");
}

/*
====================================
RENDER EDITOR
====================================
*/

function renderEditor() {

    const editor =
        document.getElementById(
            "app-editor"
        );

    editor.innerHTML = "";

    if (currentApp.steps.length === 0) {

        editor.innerHTML = `
            <p>Drag services here...</p>
        `;

        return;
    }

    currentApp.steps.forEach(
        (step, index) => {

            const div =
                document.createElement("div");

            div.className =
                "editor-step";

            /*
            ------------------------
            SERVICE
            ------------------------
            */

            if (step.type === "service") {

                div.innerHTML = `
                    <b>${index + 1}</b>
                    |
                    SERVICE
                    |
                    ${step.thing}
                    →
                    ${step.service}
                `;
            }

            /*
            ------------------------
            ORDER RELATIONSHIP
            ------------------------
            */

            else if (
                step.type === "order"
            ) {

                div.innerHTML = `
                    <b>${index + 1}</b>
                    |
                    ORDER
                    |
                    ${step.firstService.service}
                    →
                    ${step.thenService.service}
                `;
            }

            /*
            ------------------------
            CONDITION RELATIONSHIP
            ------------------------
            */

            else if (
                step.type === "condition"
            ) {

                div.innerHTML = `
                    <b>${index + 1}</b>
                    |
                    CONDITION
                    |
                    IF
                    ${step.sourceService.service}
                    ${step.operator}
                    ${step.value}
                    →
                    ${step.targetService.service}
                `;
            }

            editor.appendChild(div);
        }
    );
}

/*
====================================
SAVE APP
====================================
*/

function saveCurrentApp() {

    const name =
        document
            .getElementById(
                "app-name"
            )
            .value
            .trim();

    if (!isValidAppName(name)) {
        alert("Invalid app name");
        return;
    }

    currentApp.name = name;

    currentApp.filename =
        `${name}.iot`;

    window.saveApp(currentApp);

    renderAppsList();

    alert("App Saved");
}

/*
====================================
FINALIZE APP
====================================
*/

function finalizeCurrentApp() {

    const name =
        document
            .getElementById(
                "app-name"
            )
            .value
            .trim();

    if (!isValidAppName(name)) {
        alert("Invalid app name");
        return;
    }

    currentApp.name = name;

    currentApp.filename =
        `${name}.iot`;

    currentApp.finalized = true;

    window.saveApp(currentApp);

    renderAppsList();

    alert("App Finalized");
}

/*
====================================
CLEAR EDITOR
====================================
*/

function clearEditor() {

    currentApp = {
        name: "",
        filename: "",
        finalized: false,
        steps: []
    };

    document.getElementById(
        "app-name"
    ).value = "";

    renderEditor();
}

/*
====================================
RENDER APP LIST
====================================
*/

function renderAppsList() {

    const container =
        document.getElementById(
            "saved-apps-list"
        );

    container.innerHTML = "";

    const apps = window.loadApps();

    const finalizedApps =
        apps.filter(
            a => a.finalized
        );

    finalizedApps.forEach(app => {

        const div =
            document.createElement("div");

        div.className =
            "saved-app";

        div.innerHTML = `
            <b>${app.name}</b>

            <button class="activate-btn">
                Activate
            </button>

            <button class="delete-btn">
                Delete
            </button>
        `;

        /*
        DOUBLE CLICK = OPEN
        */

        div.addEventListener(
            "dblclick",
            () => {
                openAppInEditor(app);
            }
        );

        /*
        ACTIVATE
        */

        div.querySelector(
            ".activate-btn"
        )
            .addEventListener(
                "click",
                () => {
                    window.activateApp(app);
                }
            );

        /*
        DELETE
        */

        div.querySelector(
            ".delete-btn"
        )
            .addEventListener(
                "click",
                () => {

                    window.deleteApp(app.name);

                    renderAppsList();
                }
            );

        container.appendChild(div);
    });
}

/*
====================================
OPEN APP
====================================
*/

function openAppInEditor(app) {

    currentApp = app;

    document.getElementById(
        "app-name"
    ).value = app.name;

    renderEditor();
}

/*
====================================
ORDER RELATIONSHIP
====================================
*/

function addOrderRelationship() {

    const first =
        prompt(
            "First service name:"
        );

    const second =
        prompt(
            "Second service name:"
        );

    if (!first || !second) {
        return;
    }

    currentApp.steps.push({

        type: "order",

        firstService: {
            service: first
        },

        thenService: {
            service: second
        }
    });

    renderEditor();
}

/*
====================================
CONDITION RELATIONSHIP
====================================
*/

function addConditionRelationship() {

    const source =
        prompt(
            "Source service:"
        );

    const operator =
        prompt(
            "Operator (>, <, ==):"
        );

    const value =
        prompt(
            "Comparison value:"
        );

    const target =
        prompt(
            "Target service:"
        );

    if (
        !source ||
        !operator ||
        !value ||
        !target
    ) {
        return;
    }

    currentApp.steps.push({

        type: "condition",

        sourceService: {
            service: source
        },

        operator,

        value: Number(value),

        targetService: {
            service: target
        }
    });

    renderEditor();
}

/*
====================================
NAME VALIDATION
====================================
*/

function isValidAppName(name) {

    return /^[a-zA-Z0-9_-]{1,20}$/
        .test(name);
}

/*
====================================
EXPORTS
====================================
*/

window.initAppsTab =
    initAppsTab;

window.cleanupAppsTab =
    cleanupAppsTab;