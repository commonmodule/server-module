/// <reference types="node" />
declare class FileUtils {
    checkFileExists(path: string): Promise<boolean>;
    readBuffer(path: string): Promise<Buffer>;
    readText(path: string): Promise<string>;
    getFileInfo(path: string): Promise<{
        size: number;
        createTime: Date;
        lastUpdateTime: Date;
    }>;
    deleteFile(path: string): Promise<void>;
    createFolder(path: string): Promise<void>;
    write(path: string, content: Buffer | string): Promise<void>;
    getAllFiles(path: string): Promise<string[]>;
}
declare const _default: FileUtils;
export default _default;
//# sourceMappingURL=FileUtils.d.ts.map