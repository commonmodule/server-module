export default class ArrayUtil {
  public static pull(array: any[], ...removeList: any[]): void {
    const removeSet = new Set(removeList);
    for (let i = array.length - 1; i >= 0; i--) {
      if (removeSet.has(array[i])) {
        array.splice(i, 1);
      }
    }
  }

  public static insert(array: any[], index: number, item: any): void {
    array.splice(index, 0, item);
  }

  public static shuffle(array: number[]) {
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

  public static checkSame<T>(array1: T[], array2: T[]): boolean {
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
