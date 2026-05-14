//BROWSER NETWORK WRAPPER: makes socket easier to use and provides clean API for UI

// atlasBridge.js
export class AtlasBridge {//it wraps the socket
    constructor(socketUrl = 'http://localhost:3000') {
        this.socket = window.io(socketUrl); //connects Websocket to server node
        this.handlers = new Set(); //callback list, so we don't get duplicates
        this.connected = false; //connection state

        this.socket.on('connect', () => { //when the WebSocket connects
            this.connected = true;
            console.log('[AtlasBridge] connected');
        });

        this.socket.on('atlas-tweet', (data) => { //receives the event from server Node
            this._dispatch(this._parse(data));
        });
    }

    _parse(data) {
        try {
            return JSON.parse(data);
        } catch {
            return { raw: data };
        }
    }

    _dispatch(tweet) {
        for (const h of this.handlers) {
            h(tweet);
        }
    }

    onTweet(handler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler); // unsubscribe
    }

    isConnected() {
        return this.connected;
    }
}

