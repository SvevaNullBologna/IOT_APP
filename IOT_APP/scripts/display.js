
function renderList(html, containerId) {

    const container = document.getElementById(containerId);

    if (!container) return;

    container.innerHTML = `
        <div class="iot-list-wrapper">
            ${html}
        </div>
    `;
}

//useful in case of Atlas disconnection. Even thought you visualize them, you cannot use them fully!
function all_unavailable(){

}


function showConnectionModal() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="connection-modal">
                <h3>Select Connection Type</h3>
                <button id="btn-order">Order Based</button>
                <button id="btn-condition">Condition Based</button>
                <div id="condition-input-area" style="display:none; margin-top:10px;">
                    <input type="text" id="cond-text" placeholder="e.g. value > 10">
                    <button id="btn-confirm-cond">Set Condition</button>
                </div>
                <hr>
                <button id="btn-cancel" style="background: #444;">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // ... event listeners for buttons ...
        // Ensure every button path calls overlay.remove() AND resolve()
        const condArea = overlay.querySelector('#condition-input-area');
        const condInput = overlay.querySelector('#cond-text');

        // Order Based Choice
        overlay.querySelector('#btn-order').onclick = () => {
            cleanup();
            resolve({ type: 'order', condition: null });
        };

        // Show Condition Input
        overlay.querySelector('#btn-condition').onclick = () => {
            condArea.style.display = 'block';
        };

        // Confirm Condition Choice
        overlay.querySelector('#btn-confirm-cond').onclick = () => {
            if (!condInput.value) return alert("Please enter a condition");
            cleanup();
            resolve({ type: 'condition', condition: condInput.value });
        };

        // Cancel
        overlay.querySelector('#btn-cancel').onclick = () => {
            cleanup();
            resolve(null);
        };

        // Add this inside your showConnectionModal function
        overlay.onclick = (event) => {
            if (event.target === overlay) {
                cleanup();
                resolve(null);
            }
        };

        function cleanup() {
            document.body.removeChild(overlay);
        }
    });
}