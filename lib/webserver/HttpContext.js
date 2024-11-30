import * as ZLib from "zlib";
import Logger from "../utils/Logger.js";
import UriParser from "../utils/UriParser.js";
import ErrorCode from "./ErrorCode.js";
import encodings from "./encodings.json" assert { type: "json" };
export default class HttpContext {
    req;
    res;
    _uri;
    _ip;
    _params;
    _cookie;
    _acceptEncoding;
    responsed = false;
    constructor(req, res) {
        this.req = req;
        this.res = res;
    }
    get uri() {
        if (this._uri === undefined) {
            if (this.req.url === undefined) {
                this._uri = "";
            }
            else if (this.req.url.indexOf("?") === -1) {
                this._uri = this.req.url.substring(1);
            }
            else {
                this._uri = this.req.url.substring(1, this.req.url.indexOf("?"));
            }
        }
        return this._uri;
    }
    get method() {
        return this.req.method;
    }
    get headers() {
        return this.req.headers;
    }
    get ip() {
        if (this._ip === undefined) {
            const headerIps = this.headers["x-forwarded-for"];
            if (headerIps !== undefined) {
                if (typeof headerIps === "string") {
                    this._ip = headerIps;
                }
                else {
                    this._ip = headerIps[0];
                }
            }
            if (this._ip === undefined) {
                this._ip = this.req.socket.remoteAddress;
                if (this._ip === undefined) {
                    this._ip = "";
                }
            }
            if (this._ip.substring(0, 7) === "::ffff:") {
                this._ip = this._ip.substring(7);
            }
        }
        return this._ip;
    }
    get params() {
        if (this._params === undefined) {
            this._params = {};
            if (this.req.url !== undefined) {
                const s1 = this.req.url.split("?");
                if (s1.length > 1) {
                    const s2 = s1[1].split("&");
                    for (const s of s2) {
                        const s3 = s.split("=");
                        this._params[s3[0]] = s3[1];
                    }
                }
            }
        }
        return this._params;
    }
    get acceptEncoding() {
        if (this._acceptEncoding === undefined) {
            const headers = this.headers["accept-encoding"];
            if (typeof headers === "string") {
                this._acceptEncoding = headers;
            }
            else if (headers === undefined) {
                this._acceptEncoding = "";
            }
            else {
                this._acceptEncoding = headers[0];
            }
        }
        return this._acceptEncoding;
    }
    get cookie() {
        if (this._cookie === undefined) {
            this._cookie = {};
            if (this.headers.cookie !== undefined) {
                const s1 = this.headers.cookie.split(";");
                for (const s of s1) {
                    const s2 = s.split("=");
                    this._cookie[s2[0].trim()] = s2[1];
                }
            }
        }
        return this._cookie;
    }
    async readBody() {
        const buffers = [];
        for await (const chunk of this.req) {
            buffers.push(chunk);
        }
        return Buffer.concat(buffers).toString();
    }
    async readData() {
        return JSON.parse(await this.readBody());
    }
    async route(pattern, handler) {
        const params = {};
        if (this.responsed !== true &&
            UriParser.parse(this.uri, pattern, params) === true) {
            try {
                await handler(params);
            }
            catch (e) {
                console.error(e);
                await this.responseError();
            }
        }
    }
    async response({ headers = {}, statusCode = 200, contentType, encoding = "utf-8", content = "", }) {
        if (this.responsed === true) {
            console.error("Response already responsed");
            return;
        }
        if (contentType !== undefined) {
            if (encoding === undefined) {
                encoding = encodings[contentType];
            }
            headers["Content-Type"] = `${contentType}; charset=${encoding}`;
        }
        if (encoding === "utf-8" && typeof this.acceptEncoding === "string" &&
            this.acceptEncoding.match(/\bgzip\b/) !== null) {
            headers["Content-Encoding"] = "gzip";
            ZLib.gzip(content, (error, buffer) => {
                if (error !== null) {
                    Logger.error(error, this.req);
                }
                else {
                    this.res.writeHead(statusCode, headers);
                    this.res.end(buffer, encoding);
                }
            });
        }
        else {
            this.res.writeHead(statusCode, headers);
            this.res.end(content, encoding);
        }
        this.responsed = true;
    }
    async responseError(message) {
        await this.response({
            statusCode: 500,
            contentType: "text/plain",
            content: message ?? "Internal Server Error",
        });
    }
    async apiRoute(pattern, handler) {
        const params = {};
        if (this.responsed !== true &&
            UriParser.parse(this.uri, pattern, params) === true) {
            try {
                await handler(params);
            }
            catch (e) {
                console.error(e);
                await this.apiResponseError(ErrorCode.UNKNOWN_ERROR);
            }
        }
    }
    async _apiResponse({ headers = {}, statusCode = 200, contentType = "application/json", content = "", }) {
        await this.response({
            headers: {
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Origin": this.headers.origin === undefined
                    ? "*"
                    : this.headers.origin,
                ...headers,
            },
            statusCode,
            contentType,
            content,
        });
    }
    async apiResponse(data) {
        if (data === undefined || typeof data === "string") {
            await this._apiResponse({
                contentType: "text/plain",
                content: data,
            });
        }
        else {
            await this._apiResponse({
                content: JSON.stringify(data),
            });
        }
    }
    async apiResponseSuccess(code, data, additionalHeaders) {
        await this._apiResponse({
            headers: additionalHeaders,
            content: JSON.stringify({ code, ...data }),
        });
    }
    async apiResponseError(code, message, data) {
        await this._apiResponse({
            statusCode: 500,
            content: JSON.stringify({ code, message, ...data }),
        });
    }
}
//# sourceMappingURL=HttpContext.js.map