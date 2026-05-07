let atlasSocket = null;

function find_atlas(ip, port){
    atlasSocket = new WebSocket(`ws://${ip}:${port}`);

    atlasSocket.onopen = () => {
        console.log("Connected to Atlas");
    };

    atlasSocket.onmessage = (event) => {
        console.log("Raw tweet:", event.data);
        try{
            const tweet = JSON.parse(event.data);
            read_atlas_tweet(tweet);
        }catch(err){
            console.error("Invalid JSON tweet",err);
        }
    };

    atlasSocket.onerror = (err) => {
        console.error("Socket error:", err);
    };

    atlasSocket.onclose = () => {
        console.log("Disconnected from Atlas");
    }
}

function read_atlas_tweet(tweet){

}

function disconnect_from_atlas(){

}

