import { EventContainer } from "@common-module/ts";
import { exec } from "child_process";
import fs from "fs/promises";
import http from "http";
import https from "https";
import tls from "tls";
import Logger from "../utils/Logger.js";
import HttpContext from "./HttpContext.js";
export default class WebServer extends EventContainer {
    secureContextCache = {};
    rawServer;
    constructor(options, listener) {
        super();
        const commonRequestListener = async (req, res) => {
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
            }
            catch (error) {
                Logger.error(error);
                context.responseError(`Internal Server Error: ${error}`);
            }
        };
        if (options.webServerSSL !== undefined) {
            this.createHTTPSServer(options.webServerPort, options.webServerSSL, commonRequestListener).then((server) => {
                this.rawServer = server;
                this.emit("start");
            });
            if (options.httpPortForRedirect !== undefined) {
                this.createHTTPServer(options.httpPortForRedirect, (req, res) => {
                    res.writeHead(302, {
                        Location: `https://${req.headers.host}${options.webServerPort === 443 ? "" : `:${options.webServerPort}`}${req.url}`,
                    });
                    res.end();
                });
            }
            if (options.autoRenewCertbot === true) {
                this.renewCertbot();
            }
            setInterval(() => {
                this.loadSecureContext(options.webServerSSL);
                if (options.autoRenewCertbot === true) {
                    this.renewCertbot();
                }
            }, 86400000);
        }
        else {
            this.rawServer = this.createHTTPServer(options.webServerPort, commonRequestListener);
            this.emit("start");
        }
    }
    async loadSecureContext(ssl) {
        const promises = [];
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
    async createHTTPSServer(port, ssl, requestListener) {
        await this.loadSecureContext(ssl);
        const server = https.createServer({
            SNICallback: (domain, callback) => callback(null, this.secureContextCache[domain]),
        }, requestListener).listen(port);
        server.on("error", (error) => Logger.error(error));
        Logger.success(`secure web server running... https://localhost:${port}`);
        return server;
    }
    createHTTPServer(port, requestListener) {
        const server = http.createServer(requestListener).listen(port);
        server.on("error", (error) => Logger.error(error));
        Logger.success(`web server running... http://localhost:${port}`);
        return server;
    }
    renewCertbot() {
        exec("certbot renew", (error) => {
            if (error !== null) {
                console.error(error);
            }
        });
    }
}
//# sourceMappingURL=WebServer.js.map