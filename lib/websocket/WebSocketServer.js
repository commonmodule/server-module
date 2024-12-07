import { ChannelManager } from "@common-module/ts";
import { WebSocketServer as WSWebSocketServer } from "ws";
import Logger from "../utils/Logger.js";
class Client {
    socket;
    messageHandlers = [];
    constructor(socket) {
        this.socket = socket;
        socket.on("message", (message) => {
            for (const handler of this.messageHandlers) {
                handler(message.toString());
            }
        });
    }
    send(message) {
        this.socket.send(message);
    }
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
}
export default class WebSocketServer {
    webServer;
    handler;
    channelManagers = [];
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
        server.on("connection", (socket, request) => this.onConnection(socket, request));
        Logger.success("websocket server running...");
    }
    onConnection(socket, request) {
        const channelManager = new ChannelManager(new Client(socket));
        this.channelManagers.push(channelManager);
        this.handler(channelManager, request);
    }
}
//# sourceMappingURL=WebSocketServer.js.map