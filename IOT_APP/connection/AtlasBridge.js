//BROWSER NETWORK WRAPPER: makes socket easier to use and provides clean API for UI

// atlasBridge.js
export class AtlasBridge {//it wraps the socket
    constructor(socketUrl = 'http://127.0.0.1:3000') {
        this.socket = window.io(socketUrl); //connects Websocket to server node
        this.handlers = new Set(); //callback list, so we don't get duplicates
        this.statusHandlers = new Set();
        this.connected = false; //connection state

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

    callService(thingId, serviceName, serviceInputs = []){ 
        if(!this.connected){
            console.error('[AtlasBridge] Cannot call service: Disconnected.');
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
}
