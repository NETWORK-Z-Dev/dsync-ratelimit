export default class ArrayTools {
    constructor(arr = []) {
        this.arr = arr;
    }

    addEntry(value) {
        this.arr.push(value);
    }

    removeEntry(value) {
        this.arr = this.arr.filter(v => v !== value);
    }

    matches(value) {
        return this.arr.some(v => {
            if (v instanceof RegExp) return v.test(value);

            if (typeof v === "string") {
                const m = v.match(/^\/(.+)\/([gimsuy]*)$/);
                if (m) {
                    try {
                        return new RegExp(m[1], m[2]).test(value);
                    } catch {
                        return false;
                    }
                }
                return v === value;
            }

            return false;
        });
    }


    getArray() {
        return this.arr;
    }
}
