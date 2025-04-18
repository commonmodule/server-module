import { EventContainer } from "@commonmodule/ts";
import http from "http";
import https from "https";
import HttpContext from "./HttpContext.js";
type SSLInfo = {
    [domain: string]: {
        key: string;
        cert: string;
    };
};
export interface WebServerOptions {
    webServerPort: number;
    webServerSSL?: SSLInfo;
    httpPortForRedirect?: number;
    autoRenewCertbot?: boolean;
}
export default class WebServer extends EventContainer<{
    start: () => void;
}> {
    private secureContextCache;
    rawServer: https.Server | http.Server | undefined;
    constructor(options: WebServerOptions, listener: (context: HttpContext) => Promise<void>);
    private loadSecureContext;
    private createHTTPSServer;
    private createHTTPServer;
    private renewCertbot;
}
export {};
//# sourceMappingURL=WebServer.d.ts.map