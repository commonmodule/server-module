import { ChannelManager, RealtimeClient } from "@common-module/ts";
import * as HTTP from "http";
import { WebSocket, WebSocketServer as WSWebSocketServer } from "ws";
import Logger from "../utils/Logger.js";
import WebServer from "../webserver/WebServer.js";

class Client implements RealtimeClient {
  private messageHandlers: Array<(message: string) => void> = [];

  constructor(private socket: WebSocket) {
    socket.on("message", (message) => {
      for (const handler of this.messageHandlers) {
        handler(message.toString());
      }
    });
  }

  public send(message: string): void {
    this.socket.send(message);
  }

  public onMessage(handler: (message: string) => void): void {
    this.messageHandlers.push(handler);
  }
}

export default class WebSocketServer<
  H extends Record<string, (...args: any[]) => any>,
> {
  private channelManagers: ChannelManager<H>[] = [];

  constructor(
    private webServer: WebServer,
    private handler: (
      channelManager: ChannelManager<H>,
      request: HTTP.IncomingMessage,
    ) => void,
  ) {
    if (webServer.rawServer === undefined) {
      webServer.on("start", async () => this.launch());
    } else {
      this.launch();
    }
  }

  private launch() {
    const server = new WSWebSocketServer({ server: this.webServer.rawServer });
    server.on("error", (error) => Logger.error(error));
    server.on(
      "connection",
      (socket, request) => this.onConnection(socket, request),
    );
    Logger.success("websocket server running...");
  }

  private onConnection(socket: WebSocket, request: HTTP.IncomingMessage) {
    const channelManager = new ChannelManager(new Client(socket));
    this.channelManagers.push(channelManager);
    this.handler(channelManager, request);
  }
}
