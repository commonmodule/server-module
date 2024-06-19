export default class StringUtil {
    static toTitleCase(str) {
        return str.replace(/(^\w|\s\w)(\S*)/g, (_, m1, m2) => m1.toUpperCase() + m2.toLowerCase());
    }
    static shortenEthereumAddress(address) {
        if (address.length !== 42 || !address.startsWith("0x"))
            return address;
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    }
    static numberWithCommas(x, fixed) {
        if (fixed === undefined || +(+x) > Number.MAX_SAFE_INTEGER) {
            const parts = x.split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts[1] === "0" ? parts[0] : parts.join(".");
        }
        const parts = String(+(+x).toFixed(fixed)).split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }
}
//# sourceMappingURL=StringUtil.js.map