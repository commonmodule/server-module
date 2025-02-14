/// <reference types="node" />
import { MessageChannelManager } from "@common-module/ts";
import { IncomingMessage } from "http";
import WebServer from "../webserver/WebServer.js";
export default class WebSocketServer<H extends Record<string, (...args: any[]) => any>> {
    private webServer;
    private handler;
    private channelManagers;
    constructor(webServer: WebServer, handler: (channelManager: MessageChannelManager<H>, request: IncomingMessage) => void);
    private launch;
    private onConnection;
}
//# sourceMappingURL=WebSocketServer.d.ts.map