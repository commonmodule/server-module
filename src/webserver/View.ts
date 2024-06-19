export interface ViewParams {
  [name: string]: string | undefined;
}

export default abstract class View {
  protected closed = false;

  public changeParams(params: ViewParams, uri: string): void {}
  public close(): void {
    this.closed = true;
  }
}
