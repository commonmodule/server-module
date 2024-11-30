import { ViewParams } from "../webserver/View.js";
declare class UriParser {
    private paramRegex;
    match(uriParts: string[], patternParts: string[], params?: ViewParams): boolean;
    parse(uri: string, pattern: string, params: ViewParams): boolean;
}
declare const _default: UriParser;
export default _default;
//# sourceMappingURL=UriParser.d.ts.map