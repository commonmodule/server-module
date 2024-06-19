import Calendar from "./Calendar.js";
export default class Logger {
    static get time() {
        const time = new Calendar();
        return `${time.monthFormal}-${time.dateFormal} ${time.hoursFormal}:${time.minutesFormal}`;
    }
    static success(message) {
        console.log(`[32m[${this.time}] ${message}[0m`);
    }
    static warning(message) {
        console.log(`[33m[${this.time}] ${message}[0m`);
        console.trace();
    }
    static error(message, parameters) {
        console.log(`[31m[${this.time}] ${message}[0m`, parameters === undefined ? "" : parameters);
        console.trace();
    }
}
//# sourceMappingURL=Logger.js.map