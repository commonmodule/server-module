import { EventContainer } from "@commonmodule/ts";
import { exec } from "child_process";
import fs from "fs/promises";
import http, { IncomingMessage, ServerResponse } from "http";
import https from "https";
import tls, { SecureContext } from "tls";
import Logger from "../utils/Logger.js";
import HttpContext from "./HttpContext.js";

type SSLInfo = { [domain: string]: { key: string; cert: string } };
type RequestListener = (
  req: IncomingMessage,
  res: ServerResponse,
) => void;

export interface WebServerOptions {
  webServerPort: number;
  webServerSSL?: SSLInfo;
  httpPortForRedirect?: number;
  autoRenewCertbot?: boolean;
}

export default class WebServer extends EventContainer<{
  start: () => void;
}> {
  private secureContextCache: { [domain: string]: SecureContext } = {};
  public rawServer: https.Server | http.Server | undefined;

  constructor(
    options: WebServerOptions,
    listener: (context: HttpContext) => Promise<void>,
  ) {
    super();

    const commonRequestListener: RequestListener = async (req, res) => {
      const context = new HttpContext(req, res);

      if (context.method === "OPTIONS") {
        context.response({
          headers: {
            "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Origin": "*",
          },
        });
        return;
      }

      try {
        await listener(context);
      } catch (error: any) {
        Logger.error(error);
        context.responseError(`Internal Server Error: ${error}`);
      }
    };

    if (options.webServerSSL !== undefined) {
      this.createHTTPSServer(
        options.webServerPort,
        options.webServerSSL,
        commonRequestListener,
      ).then((server) => {
        this.rawServer = server;
        this.emit("start");
      });

      if (options.httpPortForRedirect !== undefined) {
        this.createHTTPServer(options.httpPortForRedirect, (req, res) => {
          res.writeHead(302, {
            Location: `https://${req.headers.host}${
              options.webServerPort === 443 ? "" : `:${options.webServerPort}`
            }${req.url}`,
          });
          res.end();
        });
      }

      if (options.autoRenewCertbot === true) {
        this.renewCertbot();
      }

      // renew certbot every 24 hours
      setInterval(() => {
        this.loadSecureContext(options.webServerSSL!);
        if (options.autoRenewCertbot === true) {
          this.renewCertbot();
        }
      }, 86400000);
    } else {
      this.rawServer = this.createHTTPServer(
        options.webServerPort,
        commonRequestListener,
      );
      this.emit("start");
    }
  }

  private async loadSecureContext(ssl: SSLInfo) {
    const promises: Promise<void>[] = [];
    for (const [domain, c] of Object.entries(ssl)) {
      promises.push((async () => {
        this.secureContextCache[domain] = tls.createSecureContext({
          key: await fs.readFile(c.key),
          cert: await fs.readFile(c.cert),
        }).context;
      })());
    }
    await Promise.all(promises);
  }

  private async createHTTPSServer(
    port: number,
    ssl: SSLInfo,
    requestListener: RequestListener,
  ) {
    await this.loadSecureContext(ssl);
    const server = https.createServer({
      SNICallback: (domain, callback) =>
        callback(null, this.secureContextCache[domain]),
    }, requestListener).listen(port);
    server.on("error", (error) => Logger.error(error));
    Logger.success(`secure web server running... https://localhost:${port}`);
    return server;
  }

  private createHTTPServer(port: number, requestListener: RequestListener) {
    const server = http.createServer(requestListener).listen(port);
    server.on("error", (error) => Logger.error(error));
    Logger.success(`web server running... http://localhost:${port}`);
    return server;
  }

  private renewCertbot() {
    exec("certbot renew", (error) => {
      if (error !== null) {
        console.error(error);
      }
    });
  }
}
