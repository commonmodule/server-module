import * as Path from "path";
import FileUtil from "../utils/FileUtil.js";
import WebServer from "./WebServer.js";
import content_types from "./content_types.json" assert { type: "json" };
export default class FileServer extends WebServer {
    options;
    static contentTypeFromPath(path) {
        const extension = Path.extname(path).substring(1);
        const contentType = content_types[extension];
        return contentType === undefined ? "application/octet-stream" : contentType;
    }
    publicFolderPath;
    constructor(options, listener) {
        super(options, async (context) => {
            if (listener !== undefined)
                await listener(context);
            if (context.responsed !== true) {
                const filename = Path.basename(context.uri);
                if (filename.startsWith(".")) {
                    console.warn(`WARNING: ${context.ip} tried to access a hidden file: ${filename}`);
                    await context.response({
                        statusCode: 403,
                        content: `WARNING: Your IP address ${context.ip} has been logged and reported for suspicious activity. Any further attempts to breach our security will be met with serious legal consequences. Please cease and desist immediately.`,
                    });
                }
                else if (context.uri.includes("..") === true) {
                    console.warn(`WARNING: ${context.ip} tried to access a file outside of the public folder.`);
                    await context.response({
                        statusCode: 403,
                        content: `WARNING: Your IP address ${context.ip} has been logged and reported for suspicious activity. Any further attempts to breach our security will be met with serious legal consequences. Please cease and desist immediately.`,
                    });
                }
                else if (context.headers.range !== undefined) {
                    await this.responseStream(context);
                }
                else if (context.method === "GET") {
                    await this.responseResource(context);
                }
            }
        });
        this.options = options;
        this.publicFolderPath = `${process.cwd()}/${options.publicFolderPath ?? "public"}`;
    }
    async responseStream(context) {
    }
    modifyIndexFileContent(content) {
        return content;
    }
    async responseResource(context) {
        try {
            const contentType = FileServer.contentTypeFromPath(context.uri);
            const content = await FileUtil.readBuffer(`${this.publicFolderPath}/${context.uri}`);
            await context.response({ content, contentType });
        }
        catch (error) {
            try {
                const indexFileContent = await FileUtil.readText(`${this.publicFolderPath}/${this.options.indexFilePath === undefined
                    ? "index.html"
                    : this.options.indexFilePath}`);
                await context.response({
                    content: this.modifyIndexFileContent(indexFileContent),
                    contentType: "text/html",
                });
            }
            catch (error) {
                await context.response({ statusCode: 404 });
            }
        }
    }
}
//# sourceMappingURL=FileServer.js.map