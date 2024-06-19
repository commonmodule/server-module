import ArrayUtil from "../util/ArrayUtil.js";
export default class EventContainer {
    static NEXT_ID = 0;
    id = EventContainer.NEXT_ID++;
    eventMap = {};
    delegateEvents = [];
    deleted = false;
    addEventHandler(eventName, eventHandler) {
        if (this.eventMap[eventName] === undefined) {
            this.eventMap[eventName] = [];
        }
        this.eventMap[eventName].push(eventHandler);
    }
    removeDelegateEvents(delegateEvents) {
        for (const [eventName, events] of Object.entries(delegateEvents.events)) {
            for (const event of events) {
                delegateEvents.delegate.off(eventName, event);
            }
        }
        ArrayUtil.pull(this.delegateEvents, delegateEvents);
    }
    on(eventName, eventHandler) {
        if (Array.isArray(eventName)) {
            for (const name of eventName) {
                this.addEventHandler(name, eventHandler);
            }
        }
        else {
            this.addEventHandler(eventName, eventHandler);
        }
    }
    once(eventName, eventHandler) {
        const onceEventHandler = (...params) => {
            this.off(eventName, onceEventHandler);
            eventHandler(...params);
        };
        this.addEventHandler(eventName, onceEventHandler);
    }
    off(eventName, eventHandler) {
        if (this.eventMap?.[eventName] !== undefined) {
            ArrayUtil.pull(this.eventMap[eventName], eventHandler);
            if (this.eventMap[eventName].length === 0) {
                delete this.eventMap[eventName];
            }
        }
    }
    async fireEvent(eventName, ...params) {
        const results = [];
        const promises = [];
        if (this.eventMap[eventName] !== undefined) {
            for (const eventHandler of [...this.eventMap[eventName]]) {
                const result = eventHandler(...params);
                if (result instanceof Promise) {
                    promises.push(result);
                }
                else {
                    results.push(result);
                }
            }
        }
        return results.concat(await Promise.all(promises));
    }
    onDelegate(delegate, eventName, eventHandler) {
        let delegateEvents = this.delegateEvents.find((de) => de.delegate === delegate);
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
    offDelegate(delegate) {
        const delegateEvents = this.delegateEvents.find((de) => de.delegate === delegate);
        if (delegateEvents !== undefined) {
            this.removeDelegateEvents(delegateEvents);
        }
    }
    offAll() {
        this.eventMap = {};
        for (const delegateEvents of this.delegateEvents) {
            this.removeDelegateEvents(delegateEvents);
        }
        this.delegateEvents = [];
    }
    delete() {
        for (const delegateEvents of this.delegateEvents) {
            this.removeDelegateEvents(delegateEvents);
        }
        this.delegateEvents = undefined;
        this.fireEvent("delete");
        this.eventMap = undefined;
        this.deleted = true;
    }
}
//# sourceMappingURL=EventContainer.js.map