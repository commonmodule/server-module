import * as FS from "fs";
import * as Path from "path";
class FileUtil {
    async checkFileExists(path) {
        if (path === "./") {
            return true;
        }
        else {
            return new Promise((resolve) => {
                FS.access(path, (error) => {
                    if (error !== null) {
                        resolve(false);
                    }
                    else {
                        FS.readdir(Path.dirname(path), (error2, names) => {
                            if (error2 !== null) {
                                resolve(false);
                            }
                            else {
                                resolve(names.includes(Path.basename(path)));
                            }
                        });
                    }
                });
            });
        }
    }
    async readBuffer(path) {
        if (await this.checkFileExists(path) !== true) {
            throw new Error(`${path} Not Exists`);
        }
        else {
            return new Promise((resolve, reject) => {
                FS.stat(path, (error, stat) => {
                    if (error !== null) {
                        reject(error);
                    }
                    else if (stat.isDirectory() === true) {
                        reject(new Error(`${path} Is Folder`));
                    }
                    else {
                        FS.readFile(path, (error2, buffer) => {
                            if (error2 !== null) {
                                reject(error2);
                            }
                            else {
                                resolve(buffer);
                            }
                        });
                    }
                });
            });
        }
    }
    async readText(path) {
        return (await this.readBuffer(path)).toString();
    }
    async getFileInfo(path) {
        if (await this.checkFileExists(path) !== true) {
            throw new Error(`${path} Not Exists`);
        }
        else {
            return new Promise((resolve, reject) => {
                FS.stat(path, (error, stat) => {
                    if (error !== null) {
                        reject(error);
                    }
                    else {
                        resolve({
                            size: stat.isDirectory() === true ? 0 : stat.size,
                            createTime: stat.birthtime,
                            lastUpdateTime: stat.mtime,
                        });
                    }
                });
            });
        }
    }
    async deleteFile(path) {
        if (await this.checkFileExists(path) === true) {
            return new Promise((resolve, reject) => {
                FS.unlink(path, (error) => {
                    if (error !== null) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
    }
    async createFolder(path) {
        if (await this.checkFileExists(path) !== true) {
            const folderPath = Path.dirname(path);
            if (folderPath !== path && folderPath + "/" !== path) {
                if (folderPath === "." || await this.checkFileExists(folderPath) === true) {
                    return new Promise((resolve, reject) => {
                        FS.mkdir(path, (error) => {
                            if (error !== null) {
                                reject(error);
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                }
                else {
                    await this.createFolder(folderPath);
                    return this.createFolder(path);
                }
            }
        }
    }
    async write(path, content) {
        await this.createFolder(Path.dirname(path));
        return new Promise((resolve, reject) => {
            FS.writeFile(path, content, (error) => {
                if (error !== null) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async getAllFiles(path) {
        const files = [];
        if (await this.checkFileExists(path) !== true) {
            throw new Error(`${path} Not Exists`);
        }
        else {
            return new Promise((resolve, reject) => {
                FS.readdir(path, { withFileTypes: true }, (error, dirEntries) => {
                    if (error !== null) {
                        reject(error);
                    }
                    else {
                        const promises = [];
                        for (const dirEntry of dirEntries) {
                            const fullPath = Path.join(path, dirEntry.name);
                            if (dirEntry.isDirectory()) {
                                const promise = this.getAllFiles(fullPath)
                                    .then((subFiles) => {
                                    files.push(...subFiles);
                                });
                                promises.push(promise);
                            }
                            else if (dirEntry.isFile()) {
                                files.push(fullPath);
                            }
                        }
                        Promise.all(promises)
                            .then(() => resolve(files))
                            .catch(reject);
                    }
                });
            });
        }
    }
}
export default new FileUtil();
//# sourceMappingURL=FileUtil.js.map