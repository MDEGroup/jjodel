import {io} from 'socket.io-client';

class WebSockets {
    static collaborative = io('/', {path: '/collaborative', autoConnect: false});
    static iot = io('/', {path: '/iot', autoConnect: false});
}

export default WebSockets;
