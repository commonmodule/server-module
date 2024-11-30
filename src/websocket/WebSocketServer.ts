import * as HTTP from "http";
import { WebSocket, WebSocketServer as WSWebSocketServer } from "ws";
import Logger from "../utils/Logger.js";
import WebServer from "../webserver/WebServer.js";

class Client {
  constructor(
    private socket: WebSocket,
    private request: HTTP.IncomingMessage,
  ) {
  }
}

export default class WebSocketServer {
  private clients: Client[] = [];

  constructor(
    private webServer: WebServer,
    private handler: (client: Client) => void,
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
    server.on("connection", (socket, request) => this.onConn(socket, request));
    Logger.success("websocket server running...");
  }

  private onConn(socket: WebSocket, request: HTTP.IncomingMessage) {
    const client = new Client(socket, request);
    this.clients.push(client);
    this.handler(client);
  }
}
