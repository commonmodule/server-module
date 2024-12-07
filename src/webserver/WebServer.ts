import { EventContainer } from "@common-module/ts";
import { exec } from "child_process";
import * as HTTP from "http";
import * as HTTPS from "https";
import * as TLS from "tls";
import { SecureContext } from "tls";
import FileUtils from "../utils/FileUtils.js";
import Logger from "../utils/Logger.js";
import HttpContext from "./HttpContext.js";

type SSLInfo = { [domain: string]: { key: string; cert: string } };
type RequestListener = (
  req: HTTP.IncomingMessage,
  res: HTTP.ServerResponse,
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
  public rawServer: HTTPS.Server | HTTP.Server | undefined;

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
      } catch (error) {
        Logger.error(error);
        context.responseError("Internal Server Error");
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
        this.secureContextCache[domain] = TLS.createSecureContext({
          key: await FileUtils.readBuffer(c.key),
          cert: await FileUtils.readBuffer(c.cert),
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
    const server = HTTPS.createServer({
      SNICallback: (domain, callback) =>
        callback(null, this.secureContextCache[domain]),
    }, requestListener).listen(port);
    server.on("error", (error) => Logger.error(error));
    Logger.success(`secure web server running... https://localhost:${port}`);
    return server;
  }

  private createHTTPServer(port: number, requestListener: RequestListener) {
    const server = HTTP.createServer(requestListener).listen(port);
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
