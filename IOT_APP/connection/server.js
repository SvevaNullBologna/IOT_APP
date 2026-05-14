const dgram = require('dgram');
const os = require('os');
const http = require('http');
const { Server } = require('socket.io');

const MULTICAST_GROUP = '232.1.1.1';
const PORT = 1235;


const httpServer = http.createServer();
const io = new Server(httpServer, {
    cors: {origin: "*",
        methods: ["GET", "POST"]
    }
});

// Function to find local IP (exactly like your Python connect method)
function getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        // Skip the VirtualBox adapter that's causing the headache
        if (name.includes('Ethernet 2')) continue; 

        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '0.0.0.0';
}

const localIP = getLocalIP();
const server = dgram.createSocket({ type: 'udp4', reuseAddr: true });

server.on('error', (err) => {
    console.log(`Server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    const rawContent = msg.toString();
    
    // 1. Extract the JSON block (equivalent to your .rfind in Python)
    const start = rawContent.lastIndexOf('{');
    const end = rawContent.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
        const block = rawContent.substring(start, end + 1);

        // 2. Regex to find "key" : "value" patterns
        // g = global, so it finds all matches
        const pattern = /"([^"]+)"\s*:\s*"(.*)"(?=\s*[,}])/g;
        const result = {};
        let match;

        while ((match = pattern.exec(block)) !== null) {
            // match[1] is the key, match[2] is the value
            result[match[1]] = match[2];
        }

        // 3. Log the clean version to your console
        console.log("---------------------------------");
        console.log(`CLEAN TWEET FROM: ${rinfo.address}`);
        console.dir(result, { colors: true });

        // 4. Send the clean object to the browser
        io.emit('atlas-tweet', result);
    } else {
        console.log("Received malformed or non-JSON data:", rawContent);
    }
});

server.on('listening', () => {
    console.log(`Atlas discovery on ${localIP}....`);
    
    try {
        // Crucial: Add membership specifically to the local interface IP
        server.addMembership(MULTICAST_GROUP, localIP);
        const address = server.address();
        console.log(`Listening on ${address.address}:${address.port}`);
    } catch (e) {
        console.log("Error joining multicast group: ", e.message);
    }
});

// IMPORTANT: Bind to the local IP specifically, just like your Python code did
server.bind(PORT, localIP);

const WEB_PORT = 3000;
    httpServer.listen(WEB_PORT, () => {
        console.log(`Web interface socket ready on port ${WEB_PORT}`);
    });
    