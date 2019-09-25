export const stableSort = (array, order, orderBy) => {
    let desc = (a, b) => {
        let aa = getPropFast(a, orderBy);
        let bb = getPropFast(b, orderBy);
        if (bb < aa) return -1;
        if (bb > aa) return 1;
        return 0;
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
    let desc = (a, b) => {
        let aa = getPropFast(a, orderBy);
        let bb = getPropFast(b, orderBy);
        if (bb < aa) return -1;
        if (bb > aa) return 1;
        aa = getPropFast(a, thenBy);
        bb = getPropFast(b, thenBy);
        if (bb < aa) return -1;
        if (bb > aa) return 1;
        return 0;
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
