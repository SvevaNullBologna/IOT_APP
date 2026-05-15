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
    
    // 1. Extract the JSON block Announcing_tweet : { ... } => {...}
    const start = rawContent.lastIndexOf('{');
    const end = rawContent.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
        let body = rawContent.substring(start + 1, end).trim();

        //the json is malphormed, therefore we work with "stringswith""" : "stringwith""" , 
        //SO we can separate key-value couples with "," 
        //we can separate key and value with ":"
            
        const result = {};

        while(body.length > 0){
            const colonIndex = body.indexOf(':');
            if (colonIndex === -1) break;

            // EXTRACT KEY before : 
            let keyPart = body.substring(0, colonIndex).trim();
            if(keyPart.startsWith('"') && keyPart.endsWith('"')){
                keyPart = keyPart.slice(1,-1);
            }

            // EXTRACT VALUE after : and before , 
            let remaining = body.substring(colonIndex + 1).trim();
            let valuePart = "";
            let nextPairStart = -1;

            const nextKeyMarker = remaining.match(/",\s*"[^"]+"\s*:/);
            
            if(nextKeyMarker && nextKeyMarker.index !== undefined){ 
                // Slice right up to the closing quote of the current value
                valuePart = remaining.substring(0, nextKeyMarker.index + 1).trim();
                // The next pair starts right after the comma
                nextPairStart = nextKeyMarker.index + 2;
            }
            else{
                valuePart = remaining.trim();
            }

            if(valuePart.startsWith('"') && valuePart.endsWith('"')){
                valuePart = valuePart.slice(1,-1);
            }

            if(keyPart){ //SAVE THE KEY/VALUE COUPLE
                result[keyPart] = valuePart;
            }

            //advance body string
            if(nextPairStart !== -1){
                body = remaining.substring(nextPairStart).trim()
            }
            else{
                body = "";
            }
            
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
    