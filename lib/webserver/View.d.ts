export interface ViewParams {
    [name: string]: string | undefined;
}
export default abstract class View {
    protected closed: boolean;
    changeParams(params: ViewParams, uri: string): void;
    close(): void;
}
//# sourceMappingURL=View.d.ts.map