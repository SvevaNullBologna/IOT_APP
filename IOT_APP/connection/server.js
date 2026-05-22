const dgram = require('dgram');
const os = require('os');
const http = require('http');
const net = require('net');
const { Server } = require('socket.io');

const MULTICAST_GROUP = '232.1.1.1';
const ATLAS_PORT = 1235;


const httpServer = http.createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Function to find local IP
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

function formatInputs(inputs) {
    if (Array.isArray(inputs)) {
        return `(${inputs.join(",")})`;
    }
    return `(${inputs})`;
}


/* UTILS FOR SAVING PORT AND IP  */
const langRegistry = {}; //for knowing the ports 

function add_langRegistry(clean_tweet, rinfo) {
    if (clean_tweet["Tweet Type"] !== "Identity_Language") return;


    const thingId = clean_tweet["Thing ID"];
    const port = clean_tweet["Port"];

    if (!thingId || !port) return;

    langRegistry[thingId] = {
        ip: rinfo.address,
        port: Number(port)
    };

    console.log("REGISTERED THINGS:", langRegistry);
}

function get_langRegistry(thing_id) {
    return langRegistry[thing_id];
}

/* */

/* parsing */


function parse_atlas_tweet(rawContent){
    const start = rawContent.lastIndexOf('{');
    const end = rawContent.lastIndexOf('}');

    if (start !== -1 && end !== -1) {
        let body = rawContent.substring(start + 1, end).trim();

        //the json is malphormed, therefore we work with "stringswith""" : "stringwith""" , 
        //SO we can separate key-value couples with "," 
        //we can separate key and value with ":"

        const result = {};

        while (body.length > 0) {
            const colonIndex = body.indexOf(':');
            if (colonIndex === -1) break;

            // EXTRACT KEY before : 
            let keyPart = body.substring(0, colonIndex).trim();
            if (keyPart.startsWith('"') && keyPart.endsWith('"')) {
                keyPart = keyPart.slice(1, -1);
            }

            // EXTRACT VALUE after : and before , 
            let remaining = body.substring(colonIndex + 1).trim();
            let valuePart = "";
            let nextPairStart = -1;

            const nextKeyMarker = remaining.match(/",\s*"[^"]+"\s*:/);

            if (nextKeyMarker && nextKeyMarker.index !== undefined) {
                // Slice right up to the closing quote of the current value
                valuePart = remaining.substring(0, nextKeyMarker.index + 1).trim();
                // The next pair starts right after the comma
                nextPairStart = nextKeyMarker.index + 2;
            }
            else {
                valuePart = remaining.trim();
            }

            if (valuePart.startsWith('"') && valuePart.endsWith('"')) {
                valuePart = valuePart.slice(1, -1);
            }

            if (keyPart) { //SAVE THE KEY/VALUE COUPLE
                result[keyPart] = valuePart;
            }

            //advance body string
            if (nextPairStart !== -1) {
                body = remaining.substring(nextPairStart).trim()
            }
            else {
                body = "";
            }

        }

        return result;
    }
    console.log("Received malformed or non-JSON data:", rawContent);
    return null;
        
}

/* SOCKET LOGIC IMPLEMENTATION */

const localIP = getLocalIP();
const server = dgram.createSocket({ type: 'udp4', reuseAddr: true });

server.on('error', (err) => {
    console.log(`Server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    const rawContent = msg.toString();

    // 1. Extract the JSON block Announcing_tweet : { ... } => {...}

    let parsed = parse_atlas_tweet(rawContent);
    if(parsed){
        add_langRegistry(parsed, rinfo);


        // 3. Log the clean version to your console
        console.log("---------------------------------");
        console.log(`CLEAN TWEET FROM: ${rinfo.address}`);
        console.dir(parsed, { colors: true });

        // 4. Send the clean object to the browser
        io.emit('atlas-tweet', parsed);
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

// IMPORTANT: Bind to the local IP specifically
server.bind(ATLAS_PORT, localIP);

/* =====================================================
SEND TO ATLAS AND MOCK INJECTION HOOK FOR RELATIONSHIPS
====================================================== */




io.on('connection', (socket) => {

    socket.on('tweet', (payload) => {
        try {

            let lang_registry = get_langRegistry(payload["Thing ID"]);
            if (!lang_registry) {
                console.warn("Too early for this service call! Waiting for more knowledge... ");
                return;
            }

            const fixedPayload = {
                "Tweet Type": "Service call",
                "Thing ID": payload["Thing ID"],
                "Space ID": "Project_space",
                "Service Name": payload["Service Name"],
                "Service Inputs": formatInputs(payload["Service Inputs"])
            };
            const rawMessage = JSON.stringify(fixedPayload);

            console.log('[TCP OUTGOING]');
            console.log(rawMessage);


            const client = new net.Socket();

            // YOUR ATLAS PI
            const THING_IP = lang_registry.ip;

            // SAME PORT USED IN PYTHON
            const SERVICE_PORT = lang_registry.port;

            console.log(THING_IP, SERVICE_PORT);

            client.connect(SERVICE_PORT, THING_IP, () => {

                console.log(`[TCP] Connected to Atlas at ${THING_IP}:${SERVICE_PORT}`);

                client.write(rawMessage);
            });

            client.on('data', (data) => {

                const response = data.toString().trim();

                let parsedResponse = parse_atlas_tweet(response);

                if (parsedResponse) {
                    console.log('[TCP PARSED SUCCESS]');
                    console.dir(parsedResponse, { colors: true });

                    // Forward the clean structured object to your browser frontend
                    io.emit('atlas-tweet', parsedResponse);
                } else {
                    // Fallback for debugging if it doesn't match the standard tweet layout
                    io.emit('atlas-response', response);
                }

                client.destroy();
            });

            client.on('error', (err) => {
                console.error('[TCP ERROR]', err);
            });

            client.on('close', () => {
                console.log('[TCP] Connection closed');
            });

        } catch (err) {

            console.error('[Gateway] TCP serialization exception:', err);
        }
    });

    console.log(`[Mock Engine] Client linked. Injecting test tweets...`);

    // Injecting two testing variations (one Condition and one Order pattern)
    socket.emit('atlas-tweet', {
        "Tweet Type": "Relationship",
        "Thing ID": "valyria_rpi",
        "Space ID": "ValyriaSSnug",
        "Name": "RelA",
        "Owner": "VendorX",
        "Category": "Cooperative",
        "Type": "Dependency", // This falls back to 'condition' mapping
        "Description": "value > 45",
        "FS name": "Temperature Sensor",
        "SS name": "Air Conditioner"
    });

    socket.emit('atlas-tweet', {
        "Tweet Type": "Relationship",
        "Thing ID": "valyria_rpi",
        "Space ID": "ValyriaSSnug",
        "Name": "RelB",
        "Owner": "VendorY",
        "Category": "Cooperative",
        "Type": "Control Order", // Triggers 'order' mapping branch
        "Description": null,
        "FS name": "Motion Detector",
        "SS name": "Living Room Smart Light"
    });
});

///////////////////////////////////////////////

const WEB_PORT = 3000;
httpServer.listen(WEB_PORT, () => {
    console.log(`Web interface socket ready on port ${WEB_PORT}`);
});
