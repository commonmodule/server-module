import { ViewParams } from "../webserver/View.js";

class UriParser {
  private paramRegex = /{(.+)}/;

  public match(
    uriParts: string[],
    patternParts: string[],
    params?: ViewParams,
  ): boolean {
    for (let i = 0; i < uriParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart === undefined) return false;

      let uriPart = uriParts[i];

      if (patternPart === "**") return true;

      const paramMatch = this.paramRegex.exec(patternPart);

      if (!patternPart.startsWith("{")) {
        const index = patternPart.indexOf("{");
        if (uriPart.substring(0, index) !== patternPart.substring(0, index)) {
          return false;
        } else {
          uriPart = uriPart.substring(index);
        }
      }

      if (uriPart && paramMatch) {
        params && (params[paramMatch[1]] = uriPart);
      } else if (patternPart !== "*" && patternPart !== uriPart) {
        return false;
      }

      if (
        i === uriParts.length - 1 && i < patternParts.length - 1 &&
        patternParts[patternParts.length - 1] !== ""
      ) {
        return false;
      }
    }
    return true;
  }

  public parse(uri: string, pattern: string, params: ViewParams): boolean {
    const uriParts = uri.split("/");
    const patternParts = pattern.split("/");
    return this.match(uriParts, patternParts, params);
  }
}

export default new UriParser();
