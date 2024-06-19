export type EventHandler = (...params: any[]) => any;
export default abstract class EventContainer {
    private static NEXT_ID;
    id: number;
    private eventMap;
    private delegateEvents;
    deleted: boolean;
    private addEventHandler;
    private removeDelegateEvents;
    on(eventName: string | string[], eventHandler: EventHandler): void;
    once(eventName: string, eventHandler: EventHandler): void;
    off(eventName: string, eventHandler: EventHandler): void;
    fireEvent(eventName: string, ...params: any[]): Promise<any[]>;
    onDelegate(delegate: EventContainer, eventName: string, eventHandler: EventHandler): void;
    offDelegate(delegate: EventContainer): void;
    offAll(): void;
    delete(): void;
}
//# sourceMappingURL=EventContainer.d.ts.map