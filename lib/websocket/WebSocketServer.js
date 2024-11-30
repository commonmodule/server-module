import { WebSocketServer as WSWebSocketServer } from "ws";
import Logger from "../utils/Logger.js";
class Client {
    socket;
    request;
    constructor(socket, request) {
        this.socket = socket;
        this.request = request;
    }
}
export default class WebSocketServer {
    webServer;
    handler;
    clients = [];
    constructor(webServer, handler) {
        this.webServer = webServer;
        this.handler = handler;
        if (webServer.rawServer === undefined) {
            webServer.on("start", async () => this.launch());
        }
        else {
            this.launch();
        }
    }
    launch() {
        const server = new WSWebSocketServer({ server: this.webServer.rawServer });
        server.on("error", (error) => Logger.error(error));
        server.on("connection", (socket, request) => this.onConn(socket, request));
        Logger.success("websocket server running...");
    }
    onConn(socket, request) {
        const client = new Client(socket, request);
        this.clients.push(client);
        this.handler(client);
    }
}
//# sourceMappingURL=WebSocketServer.js.map