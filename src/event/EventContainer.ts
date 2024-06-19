import ArrayUtil from "../util/ArrayUtil.js";

type Events = { [eventName: string]: EventHandler[] };

export type EventHandler = (...params: any[]) => any;

export default abstract class EventContainer {
  private static NEXT_ID = 0;

  public id = EventContainer.NEXT_ID++;

  private eventMap: Events = {};
  private delegateEvents: { delegate: EventContainer; events: Events }[] = [];

  public deleted = false;

  private addEventHandler(eventName: string, eventHandler: EventHandler): void {
    if (this.eventMap[eventName] === undefined) {
      this.eventMap[eventName] = [];
    }
    this.eventMap[eventName].push(eventHandler);
  }

  private removeDelegateEvents(
    delegateEvents: { delegate: EventContainer; events: Events },
  ): void {
    for (const [eventName, events] of Object.entries(delegateEvents.events)) {
      for (const event of events) {
        delegateEvents.delegate.off(eventName, event);
      }
    }
    ArrayUtil.pull(this.delegateEvents, delegateEvents);
  }

  public on(eventName: string | string[], eventHandler: EventHandler) {
    if (Array.isArray(eventName)) {
      for (const name of eventName) {
        this.addEventHandler(name, eventHandler);
      }
    } else {
      this.addEventHandler(eventName, eventHandler);
    }
  }

  public once(eventName: string, eventHandler: EventHandler) {
    const onceEventHandler: EventHandler = (...params) => {
      this.off(eventName, onceEventHandler);
      eventHandler(...params);
    };
    this.addEventHandler(eventName, onceEventHandler);
  }

  public off(eventName: string, eventHandler: EventHandler) {
    if (this.eventMap?.[eventName] !== undefined) {
      ArrayUtil.pull(this.eventMap[eventName], eventHandler);
      if (this.eventMap[eventName].length === 0) {
        delete this.eventMap[eventName];
      }
    }
  }

  public async fireEvent(eventName: string, ...params: any[]): Promise<any[]> {
    const results: any[] = [];
    const promises: Promise<void>[] = [];
    if (this.eventMap[eventName] !== undefined) {
      for (const eventHandler of [...this.eventMap[eventName]]) {
        const result = eventHandler(...params);
        if (result instanceof Promise) {
          promises.push(result);
        } else {
          results.push(result);
        }
      }
    }
    return results.concat(await Promise.all(promises));
  }

  public onDelegate(
    delegate: EventContainer,
    eventName: string,
    eventHandler: EventHandler,
  ): void {
    let delegateEvents = this.delegateEvents.find((de) =>
      de.delegate === delegate
    );
    if (delegateEvents === undefined) {
      delegateEvents = { delegate, events: {} };
      this.delegateEvents.push(delegateEvents);
    }
    if (delegateEvents.events[eventName] === undefined) {
      delegateEvents.events[eventName] = [];
    }
    delegateEvents.events[eventName].push(eventHandler);
    delegate.on(eventName, eventHandler);
  }

  public offDelegate(delegate: EventContainer): void {
    const delegateEvents = this.delegateEvents.find((de) =>
      de.delegate === delegate
    );
    if (delegateEvents !== undefined) {
      this.removeDelegateEvents(delegateEvents);
    }
  }

  public offAll() {
    this.eventMap = {};
    for (const delegateEvents of this.delegateEvents) {
      this.removeDelegateEvents(delegateEvents);
    }
    this.delegateEvents = [];
  }

  public delete() {
    for (const delegateEvents of this.delegateEvents) {
      this.removeDelegateEvents(delegateEvents);
    }
    (this.delegateEvents as unknown) = undefined;

    this.fireEvent("delete");
    (this.eventMap as unknown) = undefined;
    this.deleted = true;
  }
}
