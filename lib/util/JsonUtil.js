export default class JsonUtil {
    static parseWithUndefined(data) {
        if (data === null) {
            return undefined;
        }
        return JSON.parse(data, (k, v) => v === null ? undefined : v);
    }
}
//# sourceMappingURL=JsonUtil.js.map