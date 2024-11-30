/// <reference types="node" />
import * as HTTP from "http";
import { WebSocket } from "ws";
import WebServer from "../webserver/WebServer.js";
declare class Client {
    private socket;
    private request;
    constructor(socket: WebSocket, request: HTTP.IncomingMessage);
}
export default class WebSocketServer {
    private webServer;
    private handler;
    private clients;
    constructor(webServer: WebServer, handler: (client: Client) => void);
    private launch;
    private onConn;
}
export {};
//# sourceMappingURL=WebSocketServer.d.ts.map