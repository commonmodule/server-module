/// <reference types="node" />
/// <reference types="node" />
import * as HTTP from "http";
import SuccessCode from "./SuccessCode.js";
import { ViewParams } from "./View.js";
type Headers = {
    [name: string]: string | string[];
};
interface ResponseOptions {
    headers?: Headers;
    statusCode?: number;
    contentType?: string;
    encoding?: BufferEncoding;
    content?: string | Buffer;
}
export default class HttpContext {
    private req;
    private res;
    private _uri;
    private _ip;
    private _params;
    private _cookie;
    private _acceptEncoding;
    responsed: boolean;
    constructor(req: HTTP.IncomingMessage, res: HTTP.ServerResponse);
    get uri(): string;
    get method(): string | undefined;
    get headers(): HTTP.IncomingHttpHeaders;
    get ip(): string;
    get params(): {
        [name: string]: string;
    };
    get acceptEncoding(): string;
    get cookie(): {
        [name: string]: string;
    };
    readBody(): Promise<string>;
    readData(): Promise<any>;
    route(pattern: string, handler: (params: ViewParams) => Promise<void>): Promise<void>;
    response({ headers, statusCode, contentType, encoding, content, }: ResponseOptions): Promise<void>;
    responseError(message?: string): Promise<void>;
    apiRoute(pattern: string, handler: (params: ViewParams) => Promise<void>): Promise<void>;
    private _apiResponse;
    apiResponse(data?: any): Promise<void>;
    apiResponseSuccess(code: SuccessCode, data?: any, additionalHeaders?: Headers): Promise<void>;
    apiResponseError(code: string, message?: string, data?: any): Promise<void>;
}
export {};
//# sourceMappingURL=HttpContext.d.ts.map