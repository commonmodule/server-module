/// <reference types="node" />
import { ChannelManager } from "@common-module/ts";
import * as HTTP from "http";
import WebServer from "../webserver/WebServer.js";
export default class WebSocketServer<H extends Record<string, (...args: any[]) => any>> {
    private webServer;
    private handler;
    private channelManagers;
    constructor(webServer: WebServer, handler: (channelManager: ChannelManager<H>, request: HTTP.IncomingMessage) => void);
    private launch;
    private onConnection;
}
//# sourceMappingURL=WebSocketServer.d.ts.map