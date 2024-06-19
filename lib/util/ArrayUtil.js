export default class ArrayUtil {
    static pull(array, ...removeList) {
        const removeSet = new Set(removeList);
        for (let i = array.length - 1; i >= 0; i--) {
            if (removeSet.has(array[i])) {
                array.splice(i, 1);
            }
        }
    }
    static insert(array, index, item) {
        array.splice(index, 0, item);
    }
    static shuffle(array) {
        let currentIndex = array.length;
        while (currentIndex !== 0) {
            const randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex],
                array[currentIndex],
            ];
        }
        return array;
    }
    static checkSame(array1, array2) {
        if (array1.length !== array2.length) {
            return false;
        }
        const array2Set = new Set(array2);
        for (const el of array1) {
            if (!array2Set.has(el)) {
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=ArrayUtil.js.map