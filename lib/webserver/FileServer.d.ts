import HttpContext from "./HttpContext.js";
import WebServer, { WebServerOptions } from "./WebServer.js";
export default class FileServer extends WebServer {
    private options;
    static contentTypeFromPath(_path: string): string;
    private publicFolderPath;
    constructor(options: WebServerOptions & {
        publicFolderPath?: string;
        indexFilePath?: string;
    }, listener?: (context: HttpContext) => Promise<void>);
    private responseStream;
    protected modifyIndexFileContent(content: string): string;
    private responseResource;
}
//# sourceMappingURL=FileServer.d.ts.map