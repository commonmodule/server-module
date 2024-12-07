import * as Path from "path";
import FileUtil from "../utils/FileUtil.js";
import HttpContext from "./HttpContext.js";
import WebServer, { WebServerOptions } from "./WebServer.js";
import content_types from "./content_types.json" assert { type: "json" };

export default class FileServer extends WebServer {
  public static contentTypeFromPath(path: string): string {
    const extension = Path.extname(path).substring(1);
    const contentType = (content_types as any)[extension];
    return contentType === undefined ? "application/octet-stream" : contentType;
  }

  private publicFolderPath: string;

  constructor(
    private options: WebServerOptions & {
      publicFolderPath?: string;
      indexFilePath?: string;
    },
    listener?: (context: HttpContext) => Promise<void>,
  ) {
    super(options, async (context) => {
      if (listener !== undefined) await listener(context);
      if (context.responsed !== true) {
        const filename = Path.basename(context.uri);
        if (filename.startsWith(".")) {
          console.warn(
            `WARNING: ${context.ip} tried to access a hidden file: ${filename}`,
          );
          await context.response({
            statusCode: 403,
            content:
              `WARNING: Your IP address ${context.ip} has been logged and reported for suspicious activity. Any further attempts to breach our security will be met with serious legal consequences. Please cease and desist immediately.`,
          });
        } else if (context.uri.includes("..") === true) {
          console.warn(
            `WARNING: ${context.ip} tried to access a file outside of the public folder.`,
          );
          await context.response({
            statusCode: 403,
            content:
              `WARNING: Your IP address ${context.ip} has been logged and reported for suspicious activity. Any further attempts to breach our security will be met with serious legal consequences. Please cease and desist immediately.`,
          });
        } else if (context.headers.range !== undefined) {
          await this.responseStream(context);
        } else if (context.method === "GET") {
          await this.responseResource(context);
        }
      }
    });
    this.publicFolderPath = `${process.cwd()}/${
      options.publicFolderPath ?? "public"
    }`;
  }

  private async responseStream(context: HttpContext) {
    //TODO:
  }

  protected modifyIndexFileContent(content: string): string {
    return content;
  }

  private async responseResource(context: HttpContext) {
    try {
      const contentType = FileServer.contentTypeFromPath(context.uri);
      const content = await FileUtil.readBuffer(
        `${this.publicFolderPath}/${context.uri}`,
      );
      await context.response({ content, contentType });
    } catch (error) {
      try {
        const indexFileContent = await FileUtil.readText(
          `${this.publicFolderPath}/${
            this.options.indexFilePath === undefined
              ? "index.html"
              : this.options.indexFilePath
          }`,
        );
        await context.response({
          content: this.modifyIndexFileContent(indexFileContent),
          contentType: "text/html",
        });
      } catch (error) {
        await context.response({ statusCode: 404 });
      }
    }
  }
}
