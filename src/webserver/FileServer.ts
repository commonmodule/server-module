import fs from "fs";
import path from "path";
import Logger from "../utils/Logger.js";
import HttpContext from "./HttpContext.js";
import WebServer, { WebServerOptions } from "./WebServer.js";
import content_types from "./content_types.json" with { type: "json" };

export default class FileServer extends WebServer {
  public static contentTypeFromPath(_path: string): string {
    const extension = path.extname(_path).substring(1);
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
        const filename = path.basename(context.uri);
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
    try {
      const filePath = `${this.publicFolderPath}/${context.uri}`;
      const stats = await fs.promises.stat(filePath);
      const totalSize = stats.size;
      const rangeHeader = context.headers.range;

      if (!rangeHeader) {
        const fileStream = fs.createReadStream(filePath);
        context.res.setHeader("Content-Length", totalSize);
        context.res.setHeader(
          "Content-Type",
          FileServer.contentTypeFromPath(context.uri),
        );
        fileStream.pipe(context.res);
        return;
      }

      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (isNaN(start) || isNaN(end) || start > end || start < 0 || end < 0) {
        await context.response({
          statusCode: 416,
          content: "Invalid Range",
        });
        return;
      }
      if (start >= totalSize || end >= totalSize) {
        context.res.setHeader("Content-Range", `bytes */${totalSize}`);
        await context.response({ statusCode: 416 });
        return;
      }

      const chunkSize = end - start + 1;
      context.res.statusCode = 206;
      context.res.setHeader(
        "Content-Range",
        `bytes ${start}-${end}/${totalSize}`,
      );
      context.res.setHeader("Accept-Ranges", "bytes");
      context.res.setHeader("Content-Length", chunkSize);
      context.res.setHeader(
        "Content-Type",
        FileServer.contentTypeFromPath(context.uri),
      );

      const fileStream = fs.createReadStream(filePath, { start, end });
      fileStream.pipe(context.res);

      fileStream.on("error", (error) => {
        Logger.error(error);
        context.responseError("Error reading file stream");
      });
    } catch (error: any) {
      Logger.error(error);
      await context.response({ statusCode: 404, content: "File not found" });
    }
  }

  protected modifyIndexFileContent(content: string): string {
    return content;
  }

  private async responseResource(context: HttpContext) {
    try {
      const contentType = FileServer.contentTypeFromPath(context.uri);
      const contentBuffer = await fs.promises.readFile(
        `${this.publicFolderPath}/${context.uri}`,
      );
      const contentArrayBuffer = contentBuffer.buffer.slice(
        contentBuffer.byteOffset,
        contentBuffer.byteOffset + contentBuffer.byteLength,
      ) as ArrayBuffer;
      await context.response({ content: contentArrayBuffer, contentType });
    } catch (error) {
      try {
        const indexFileContent = await fs.promises.readFile(
          `${this.publicFolderPath}/${
            this.options.indexFilePath === undefined
              ? "index.html"
              : this.options.indexFilePath
          }`,
          "utf8",
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
