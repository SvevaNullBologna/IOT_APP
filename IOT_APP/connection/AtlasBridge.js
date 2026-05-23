//BROWSER NETWORK WRAPPER: makes socket easier to use and provides clean API for UI

// atlasBridge.js
export class AtlasBridge {//it wraps the socket
    constructor(socketUrl = 'http://127.0.0.1:3000') {
        this.socket = window.io(socketUrl); //connects Websocket to server node
        this.handlers = new Set(); //callback list, so we don't get duplicates
        this.statusHandlers = new Set();
        this.connected = false; //connection state
        this.serviceWaiting = [];
        this.appWaiting = [];


        this.socket.on('connect', () => { //when the WebSocket connects
            this.connected = true;
            console.log('[AtlasBridge] connected');
            this._dispatchStatus(true);
        });

        this.socket.on('disconnect',() => {
            this.connected = false;
            console.warn('[AtlasBridge] disconnected / went offline');
            this._dispatchStatus(false);
        });

        this.socket.on('atlas-tweet', (data) => { //receives the event from server Node
            this._dispatch(this._parse(data));
        });
    }

    _parse(data) {
    return (typeof data === 'object') ? data : JSON.parse(data);
}

    _dispatch(tweet) {
        for (const h of this.handlers) {
            h(tweet);
        }
    }

    _dispatchStatus(isOnline){ //alerts the app layer about connection changes
        for(const h of this.statusHandlers){
            h(isOnline);
        }
    }

    onTweet(handler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler); // unsubscribe
    }

    onStatusChange(handler){ //setup a listener for online/offline events
        this.statusHandlers.add(handler);
        return () => this.statusHandlers.delete(handler);
    }

    isConnected() {
        return this.connected;
    }

    
    callService(thingId, serviceName, serviceInputs = [],  appName=null){ 
        if(!this.connected){
            console.error('[AtlasBridge] Cannot call service: Disconnected.');
            return false;
        }

        if(appName){
            this.appWaiting.push({appName, serviceName, thingId});
        }
        else{
            this.serviceWaiting.push({serviceName , thingId});
        }

        let language = window.thing_languages.find(t => t.thingId === thingId);
        if(!language){
            return false;
        }

        const payload = {
            "Tweet Type": "Service call",
            "Thing ID": thingId,
            "Service Name": serviceName,
            "Service Inputs": serviceInputs
        };

        this.socket.emit('tweet', payload);
        console.log(`[AtlasBridge] Emitting service call:`, payload);

        return true;
    }

    receivedAnswer(thingId, serviceName, result, status) {
        // 1. Try to find a match in the service queue first
        const service_index = this.serviceWaiting.findIndex(
            service => service.serviceName === serviceName && service.thingId === thingId
        );   
            
        if (service_index === -1) { //check if there is an app waiting since there is no service
            console.log("No waiting UI service found, checking app queue...");
            
            // 2. Since it's not a UI service, look inside the app queue instead
            const app_index = this.appWaiting.findIndex(
                app => app.serviceName === serviceName && app.thingId === thingId
            );
            
            if (app_index === -1) { //no app waiting too
                console.warn("No waiting target (Service or App) matches this answer.");
                return;
            }
            
            // Extract the app item and remove it from the array
            const [waiting_app] = this.appWaiting.splice(app_index, 1);
            
            // Forward to the app layer handler using the stored appName
            if (typeof window.readAppCallReply === 'function') {
                window.readAppCallReply(thingId, serviceName, waiting_app.appName, result, status);
            } else {
                console.warn("Funzione readAppCallReply non ancora caricata.");
            }

            return; 
        }
        
        // 3. If we found a UI service match, process it here
        const [waiting_service] = this.serviceWaiting.splice(service_index, 1);

        if (typeof window.readServiceCallReply === 'function') {
            window.readServiceCallReply(thingId, serviceName, result, status);
        } else {
            console.warn("Funzione readServiceCallReply non ancora caricata.");
        }
    }

    deleteWaitingApp(appName) {
        // Keeps everything that DOES NOT match the appName, deleting the target app entirely
        this.appWaiting = this.appWaiting.filter(app => app.appName !== appName);
        console.log(`[AtlasBridge] Cleared all pending entries for app: ${appName}`);
    }
}
