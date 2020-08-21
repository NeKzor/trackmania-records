const cmpOptions = { numeric: true };

export const stableSort = (array, order, orderBy) => {
    let desc = (a, b) => {
        let aa = getPropFast(a, orderBy).toString();
        let bb = getPropFast(b, orderBy).toString();
        return bb.localeCompare(aa, undefined, cmpOptions);
    };

    let cmp = order === 'desc' ? (a, b) => desc(a, b) : (a, b) => -desc(a, b);

    let sort = (a, b) => {
        let order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    };

    return array
        .map((el, index) => [el, index])
        .sort(sort)
        .map((el) => el[0]);
};
export const stableSortSort = (array, order, orderBy, thenBy) => {
    if (orderBy === thenBy) {
        return stableSort(array, order, orderBy);
    }

    let desc = (a, b) => {
        let aa = getPropFast(a, orderBy).toString();
        let bb = getPropFast(b, orderBy).toString();
        let cmp = bb.localeCompare(aa, undefined, cmpOptions);
        if (cmp !== 0) return cmp;
        aa = getPropFast(a, thenBy).toString();
        bb = getPropFast(b, thenBy).toString();
        return bb.localeCompare(aa, undefined, cmpOptions);
    };

    let cmp = order === 'desc' ? (a, b) => desc(a, b) : (a, b) => -desc(a, b);

    let sort = (a, b) => {
        let order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    };

    return array
        .map((el, index) => [el, index])
        .sort(sort)
        .map((el) => el[0]);
};

// Util which returns the value of nested objects by string: getPropFast({ a: { b: 3 } }, 'a.b') === 3
const getPropFast = (obj, path) =>
    path.indexOf('.') !== -1
        ? path
              .split('.')
              .filter((s) => s)
              .reduce((acc, val) => acc && acc[val], obj)
        : obj[path];
