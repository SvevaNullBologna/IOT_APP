let atlasSocket = null;
let heatbeatInterval;

const ip_storage = 'atlas_ip';
const port_storage = 'atlas_port';

function find_atlas(ip, port){
    atlasSocket = new WebSocket(`ws://${ip}:${port}`);

    atlasSocket.onopen = () => {
        console.log("Connected to Atlas");
        save_atlas_ip_and_port(ip, port);
        alert("connected");
    };

    atlasSocket.onmessage = (event) => {
        console.log("Data received from Atlas:", event.data);
        try{
            let rawData = event.data;

            if(rawData.includes('Announcing tweet:')){
                rawData = rawData.replace("Announcing tweet:","").trim();
            }
            const tweet = JSON.parse(event.data);
            read_atlas_tweet(tweet);
        }catch(err){
            console.error("Invalid JSON tweet", event.data, err);
        }
    };

    atlasSocket.onerror = (err) => {
        console.error("Socket error:", err);
        disconnect_from_atlas();
    };

    atlasSocket.onclose = () => {
        alert("disconnected");
    }
}


function save_atlas_ip_and_port(ip, port){//input: already checked ip and port
    localStorage.setItem(ip_storage, ip);
    localStorage.setItem(port_storage, port);
    console.log("Atlas configuration saved locally.");
}

function get_saved_atlas_ip_and_port(){
    const local_ip = localStorage.getItem(ip_storage);
    const local_port = localStorage.getItem(port_storage);
    return {
        local_ip : local_ip,
        local_port : local_port
    }
}

function empty_saved_atlas(){
    localStorage.removeItem(ip_storage);
    localStorage.removeItem(port_storage);
    console.log("Local Atlas configuration emptied.");
}

function read_atlas_tweet(tweet){
    console.log(tweet);
}

function disconnect_from_atlas(){
    if(atlasSocket){
        atlasSocket.close();
        atlasSocket = null; 
    }
}

