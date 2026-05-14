// Connect to your Node.js bridge (running on port 3000)
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log("Connected to the Node.js Multicast Bridge");
});

// This replaces your 'atlasSocket.onmessage' logic
socket.on('atlas-tweet', (data) => {
    try {
        const tweet = JSON.parse(data);
        console.log("New Tweet Received:", tweet);
        // Your function to handle the UI update
        read_atlas_tweet(tweet); 
    } catch (err) {
        console.error("Invalid JSON received from bridge", data);
    }
});

function read_atlas_tweet(tweet) {
    // Logic to display the tweet on your HTML page
    console.log("Displaying tweet:", tweet);
}

// Keep your storage functions as they are
function save_atlas_ip_and_port(ip, port) {
    localStorage.setItem('atlas_ip', ip);
    localStorage.setItem('atlas_port', port);
}