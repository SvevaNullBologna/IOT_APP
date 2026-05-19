/*
====================================
STATUS PANEL
====================================
*/

export function updateStatusPanel(
    runningApps,
    stopApp
){

    const panel =
        document.getElementById(
            "status-panel"
        );

    if(!panel) return;

    panel.innerHTML = "";

    runningApps.forEach(exec => {

        const div =
            document.createElement("div");

        div.className = "status-item";

        /*
        COMPLETED APPS
        */

        if(exec.status === "completed"){

            div.innerHTML = `
                <b>${exec.app.name}</b>
                |
                ${exec.startTime.toLocaleTimeString()}
                |
                Completed
            `;
        }

        /*
        ACTIVE APPS
        */

        else{

            div.innerHTML = `
                <b>${exec.app.name}</b>
                |
                ${exec.startTime.toLocaleTimeString()}
                |
                ${exec.status}

                <button class="stop-btn">
                    Stop
                </button>
            `;

            div.querySelector(".stop-btn")
                .addEventListener("click", () => {
                    stopApp(exec.app.name);
                });
        }

        panel.appendChild(div);
    });
}