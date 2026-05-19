/*
====================================
RUNNING APPS
====================================
*/

const runningApps = new Map();

/*
====================================
ACTIVATE APP
====================================
*/

function activateApp(app) {

    if (runningApps.has(app.name)) {

        alert(
            "App already running"
        );

        return;
    }

    const execution = {

        app,

        status: "active",

        startTime: new Date()
    };

    runningApps.set(
        app.name,
        execution
    );

    updateStatusPanel(
        runningApps,
        stopApp
    );

    runApp(app, execution);
}

/*
====================================
RUN APP
====================================
*/

async function runApp(
    app,
    execution
) {

    try {

        for (
            const step
            of app.steps
        ) {

            if (
                execution.status
                === "stopped"
            ) {
                return;
            }

            await executeWorkflowStep(
                step
            );
        }

        execution.status =
            "completed";
    }

    catch (err) {

        console.error(err);

        execution.status =
            "error";
    }

    updateStatusPanel(
        runningApps,
        stopApp
    );
}

/*
====================================
WORKFLOW STEP
====================================
*/

async function executeWorkflowStep(
    step
) {

    /*
    ------------------------
    SIMPLE SERVICE
    ------------------------
    */

    if (step.type === "service") {

        return await executeStep(
            step
        );
    }

    /*
    ------------------------
    ORDER RELATIONSHIP
    ------------------------
    */

    else if (
        step.type === "order"
    ) {

        const result1 =
            await executeStep(
                step.firstService
            );

        if (result1) {

            return await executeStep(
                step.thenService
            );
        }
    }

    /*
    ------------------------
    CONDITION RELATIONSHIP
    ------------------------
    */

    else if (
        step.type === "condition"
    ) {

        const result =
            await executeStep(
                step.sourceService
            );

        const conditionMet =
            evaluateCondition(
                result,
                step.operator,
                step.value
            );

        if (conditionMet) {

            return await executeStep(
                step.targetService
            );
        }
    }
}

/*
====================================
EXECUTE SERVICE
====================================
*/

async function executeStep(step) {

    console.log(
        "Running:",
        step
    );

    /*
    Simulated execution
    */

    await new Promise(
        r => setTimeout(r, 1000)
    );

    /*
    Fake return value
    */

    return Math.floor(
        Math.random() * 100
    );
}

/*
====================================
CONDITION EVALUATION
====================================
*/

function evaluateCondition(
    result,
    operator,
    value
) {

    switch (operator) {

        case ">":
            return result > value;

        case "<":
            return result < value;

        case "==":
            return result == value;

        default:
            return false;
    }
}

/*
====================================
STOP APP
====================================
*/

function stopApp(
    appName
) {

    const execution =
        runningApps.get(appName);

    if (!execution) return;

    /*
    Completed apps
    cannot stop
    */

    if (
        execution.status
        === "completed"
    ) {
        return;
    }

    execution.status =
        "stopped";

    runningApps.delete(
        appName
    );

    updateStatusPanel(
        runningApps,
        stopApp
    );
}

/*
====================================
EXPORTS
====================================
*/

window.activateApp = activateApp;
window.stopApp = stopApp;