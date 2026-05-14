const dgram = require('dgram');
const http = require('http');
const { Server } = require('socket.io');

const MULTICAST_GROUP = '232.1.1.1';
const MULTICAST_PORT = 1235;


const server = http.createServer();
const io = new Server(server, {cors: {origin: "*"}});


function getLocalIP(){ //find local IP
    const nets = os.networkInterfaces();
    for(const name of Object.keys(nets)){
        for(const net of nets[name]){
            if(net.famiy === 'IPv4' && !net.internal){
                return net.address;
            }
        }
    }
    return '0.0.0.0';
}


const localIP = getLocalIP();

const udpServer = dgram.createSocket({type:'udp4', reuseAddr: true});

udpServer.on('listening', () => {
    udpServer.addMembership(MULTICAST_GROUP, localIP);
    console.log(`Node Server listening for Multicast on ${MULTICAST_GROUP}:${MULTICAST_PORT}`);
});

udpServer.on('message', (msg, rinfo) => {
    let rawData = msg.toString();
    console.log(`Received from network: ${rawData}`);

    if(rawData.includes('Announcing tweet:')){
        rawData = rawData.replace("Announcing tweet:","").trim();
    }

    // Send the cleaned data to the Website via WebSocket
    io.emit('atlas-tweet', rawData);
})

udpServer.bind(MULTICAST_PORT);
httpServer.listen(3000, ()=>console.log('Bridge Active on port 3000'));