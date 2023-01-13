const asc = (a, b) => (a.key > b.key ? 1 : -1);
const desc = (a, b) => (a.key < b.key ? 1 : -1);
class DataDimension {
    constructor(table, getValue, label, meta, sort) {
        if (sort === "desc") {
            this._sort = desc;
        }
        else if (sort === "asc") {
            this._sort = asc;
        }
        else if (sort) {
            this._sort = (a, b) => sort(a.key, b.key);
        }
        this._label = label;
        this._meta = meta || null;
        this._table = table;
        this._getter = getValue;
        this._prepared = 0;
    }
    getIndexes() {
        return this._indexes;
    }
    getValue(i) {
        return this._values[i].key;
    }
    getSize() {
        return this._values.length;
    }
    getLabel() {
        return this._label;
    }
    getOptions() {
        this._prepareOptions();
        return this._values.map(a => a.key);
    }
    getMeta() {
        return this._meta;
    }
    reset() {
        this._prepared = 0;
    }
    prepare() {
        // eslint-disable-next-line
        if (this._prepared & 1)
            return;
        // eslint-disable-next-line
        this._prepared = this._prepared | 1;
        this._prepareOptions();
        const { _table, _getter, _keys } = this;
        const fSize = _table.count();
        this._values.forEach((a, i) => (a.index = i));
        const indexes = (this._indexes = new Array(fSize));
        for (let i = 0; i < fSize; i++) {
            const key = _getter(i);
            indexes[i] = _keys.get(key).index;
        }
    }
    _prepareOptions() {
        // eslint-disable-next-line
        if (this._prepared & 2)
            return;
        // eslint-disable-next-line
        this._prepared = this._prepared | 2;
        const { _table, _getter } = this;
        const fSize = _table.count();
        const keys = (this._keys = new Map());
        const values = (this._values = []);
        for (let i = 0; i < fSize; i++) {
            const key = _getter(i);
            const index = keys.get(key);
            if (typeof index === "undefined") {
                keys.set(key, (values[values.length] = { key, index: 0 }));
            }
        }
        if (this._sort)
            values.sort(this._sort);
    }
}

class DataExport {
    constructor(pivot) {
        this._pivot = pivot;
    }
    toArray({ cleanRows, filters, ops, total, marks, aggregateRows, aggregateColumns, }) {
        let row;
        const out = [];
        const limit = this._pivot.getLimit();
        const maxRow = limit.rows || 0;
        this._pivot.filter(filters);
        this._pivot.operations(ops, []);
        this._pivot.resetCursor();
        let count = 0;
        while ((row = this._pivot.next())) {
            out.push(row);
            count++;
            if (maxRow === count)
                break;
        }
        const [scaleWidth, width] = this._pivot.getWidth();
        if (cleanRows)
            this._cleanRows(out, scaleWidth);
        const result = {
            data: out,
            width: width + scaleWidth,
            scaleWidth,
        };
        if (total)
            result.total = this._pivot.total(result, total);
        result.allRows = this._pivot.aggregateRows(result, aggregateRows) || [];
        result.allColumns =
            this._pivot.aggregateColumns(result, aggregateColumns) || [];
        if (marks)
            result.marks = this._pivot.mark(result, marks);
        return result;
    }
    toNested({ filters, ops, groupOps, total, aggregateRows, aggregateColumns, marks, }) {
        this._pivot.filter(filters);
        this._pivot.operations(ops, groupOps || []);
        this._pivot.resetCursor();
        const result = this._pivot.nested();
        if (total)
            result.total = this._pivot.total(result, total);
        result.allRows = this._pivot.aggregateRows(result, aggregateRows) || [];
        result.allColumns =
            this._pivot.aggregateColumns(result, aggregateColumns) || [];
        if (marks)
            result.marks = this._pivot.mark(result, marks);
        return result;
    }
    toXHeader(data, config) {
        return this._pivot.getXHeader(data, config);
    }
    _cleanRows(data, rowsLength) {
        const count = data.length;
        const prev = new Array(rowsLength);
        for (let j = 0; j < count; j++) {
            const row = data[j];
            for (let i = 0; i < rowsLength; i++) {
                if (prev[i] !== row[i]) {
                    for (let j = i; j < rowsLength; j++)
                        prev[j] = row[j];
                    break;
                }
                row[i] = "";
            }
        }
    }
}

function t(t,e){let n="";const o=t.length;let r=0,i=!1,s=!1,u=0;for(;r<o;){const o=t[r];if(r++,'"'===o)i?n+=t.substr(u,r-u):u=r-1,i=!i;else {if(i)continue;const c=","===o||"/"===o||"*"===o||"+"===o||"-"===o||"("===o||")"===o,f=" "===o||"\t"===o||" \n"===o||"\r"===o;if(s){if(!c&&!f)continue;{const i=t.substr(u,r-u-1);n+="("===o?e.method(i):e.property(i),s=!1;}}if(f)continue;if(c)n+=o;else {"0"===o||"1"===o||"2"===o||"3"===o||"4"===o||"5"===o||"6"===o||"7"===o||"8"===o||"9"===o?n+=o:(s=!0,u=r-1);}}}return s&&(n+=e.property(t.substr(u,r-u))),n}function e(e,n){return new Function(n.propertyName,n.methodName,n.contextName,"return "+t(e,n))}

function optimize(table, order, code, allMath) {
    const math = getMath(table, code);
    const ctx = {
        table,
        order,
        from: 0,
        to: 0,
        array: (i, c) => {
            const size = c.to - c.from;
            const temp = new Array(size);
            const getter = cache[i];
            for (let j = 0; j < size; j++) {
                temp[j] = getter(c.order[j + c.from]);
            }
            return temp;
        },
    };
    return function (from, to) {
        ctx.from = from;
        ctx.to = to;
        return math(0, allMath, ctx);
    };
}
function optimizeGroup(code, allMath) {
    const math = getGroupMath(code);
    return function (v) {
        return math(v, allMath, null);
    };
}
let id = 0;
const cache = [];
function getMath(table, rule) {
    return e(rule, {
        propertyName: "d",
        methodName: "m",
        contextName: "c",
        property: (a) => {
            const i = id;
            cache[i] = table.getColumn(a).getter;
            id += 1;
            return `c.array("${i}", c)`;
        },
        method: (a) => {
            return `m.${a.toLowerCase()}`;
        },
    });
}
function getGroupMath(rule) {
    return e(rule, {
        propertyName: "d",
        methodName: "m",
        contextName: "c",
        property: () => {
            return `d`;
        },
        method: (a) => {
            return `m.${a.toLowerCase()}`;
        },
    });
}

const and = (a, b) => c => a(c) && b(c);
function buildFinder(data, key, value, context) {
    const getValue = context.getter(data, key);
    if (typeof value !== "object") {
        const check = context.compare["eq"](value);
        return i => check(getValue(i));
    }
    else {
        const ops = Object.keys(value);
        let result = null;
        for (let i = 0; i < ops.length; i++) {
            const check = context.compare[ops[i].toLowerCase()](value[ops[i]]);
            const step = i => check(getValue(i));
            result = result ? and(result, step) : step;
        }
        return result;
    }
}
function build(table, rule, context) {
    const keys = Object.keys(rule);
    let result = null;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const step = buildFinder(table, key, rule[key], context);
        result = result ? and(result, step) : step;
    }
    return result;
}
function filter(order, table, rule, context) {
    const filter = build(table, rule, context);
    return order.filter(n => filter(n));
}

class DataPivot {
    constructor(table, rows, cols, filters, config) {
        this._rows = rows;
        this._cols = cols;
        this._dims = rows.concat(cols);
        this._table = table;
        this._context = config;
        this._cursor = -1;
        this._order = this._base_order = this._sort();
        this._data = this._dims.map(a => a.getIndexes());
        this.filter(filters, true);
    }
    resetCursor() {
        this._cursor = 0;
        this._group = this._dims.map(() => null);
        if (this._order.length) {
            if (this._rows.length)
                this._nextRow();
            if (this._cols.length)
                this._nextColumn();
        }
    }
    next() {
        const { _cursor, _cols, _order, _group, _ops, _rows } = this;
        if (this._cursor >= _order.length)
            return null;
        const dimsSize = _rows.length;
        const out = new Array(dimsSize + _ops.length * _cols.length);
        // dimensions
        for (let i = 0; i < dimsSize; i++)
            out[i] = _rows[i].getValue(_group[i]);
        // get end of next line ( all dataset for columns mode )
        const to = this._rows.length
            ? this._nextRow(_cols.length > 0)
            : _order.length;
        this._fillRow(out, _cursor, to, dimsSize);
        this._cursor = to;
        return out;
    }
    nested() {
        const { _cols, _order, _rows } = this;
        const dimSize = _rows.length;
        const dimOutSize = dimSize > 0 ? 1 : 0;
        const levels = [{ data: [], values: [] }];
        const starts = _rows.map(() => 0);
        const data = [];
        let prev = [];
        let now = [];
        let from = this._cursor;
        let count = 0;
        const limit = this._context.limit.rows;
        const width = Math.min(this._context.limit.columns, (_cols.length ? this._sizes[0] * _cols[0].getSize() : 0) + dimOutSize);
        while (this._cursor < _order.length) {
            const out = new Array(width);
            prev = now;
            now = [].concat(this._group);
            // get end of next line ( all dataset for columns mode )
            const to = this._rows.length
                ? this._nextRow(_cols.length > 0)
                : _order.length;
            this._fillRow(out, from, to, dimOutSize);
            if (dimSize > 0) {
                for (let level = 0; level < dimSize; level++) {
                    if (now[level] != prev[level]) {
                        for (let j = level; j < dimSize; j++) {
                            const index = j + 1;
                            const last = index === dimSize;
                            const obj = (levels[index] = {
                                id: last ? data.length + 1 : 0,
                                data: last ? null : [],
                                values: last ? out : [_rows[j].getValue(now[j])],
                            });
                            starts[index] = from;
                            levels[j].data.push(obj);
                        }
                        break;
                    }
                }
                out[0] = _rows[dimSize - 1].getValue(now[dimSize - 1]);
                levels[dimSize].values = out;
            }
            else {
                levels[0].data.push({ data: null, values: out });
            }
            data.push(out);
            count++;
            if (count >= limit)
                break;
            this._cursor = from = to;
        }
        this._fillGroupRowInner(levels[0], 0, [null, ...this._groupOps].slice(0, _rows.length), width);
        return { tree: levels[0].data, data, width, scaleWidth: dimOutSize };
    }
    getLimit() {
        return this._context.limit;
    }
    getWidth() {
        return [
            this._rows.length,
            this._cols.length && this._ops.length
                ? this._cols[0].getSize() * this._sizes[0]
                : 0,
        ];
    }
    getXHeader(result, hConfig) {
        const { _cols, _rows, _ops, _opInfo } = this;
        const { nonEmpty, meta } = hConfig || {};
        const data = result.data;
        const isNested = result.tree;
        // compressed line
        const line = [];
        // rows prefix
        const rpref = result.tree ? Math.min(_rows.length, 1) : _rows.length;
        // count of operations, repeat step of bottom scale
        const ostep = _ops.length;
        // how many scale units in one parent
        const unitsInParent = _cols.map(a => a.getSize());
        // calculate full width of data
        const length = unitsInParent.reduce((prev, value) => prev * value, ostep);
        const fullLength = Math.min(rpref + length, this._context.limit.columns);
        // how many data points per unit
        let temp = length;
        const unitSizes = unitsInParent.map(a => (temp = temp / a));
        // result header
        const out = [];
        this._cols.forEach(() => out.push(new Array(fullLength)));
        // build compressed order
        if (nonEmpty) {
            //check all cells, include columns of cells with data
            for (let i = 0; i < rpref; i++)
                line.push(i);
            for (let j = rpref; j < fullLength; j += ostep) {
                outer: for (let i = 0; i < data.length; i++) {
                    if (typeof data[i][j] !== "undefined") {
                        for (let i = 0; i < _ops.length; i++)
                            line.push(j + i);
                        break outer;
                    }
                }
            }
            // now check each scale line
            for (let j = 0; j < _cols.length; j++) {
                const step = unitSizes[j];
                let start = -1;
                let end = 0;
                let colspan = 0;
                let text;
                // against each non-empty column
                for (let i = rpref; i < line.length; i += ostep) {
                    const test = line[i];
                    // if we inside of span
                    if (test < end) {
                        colspan += ostep;
                    }
                    else {
                        // we have reached the new span
                        // setting old one if any
                        if (colspan !== 0) {
                            out[j][start] = { colspan, text };
                        }
                        // store position of new span
                        const ind = Math.floor((test - rpref) / step);
                        start = test;
                        end = (ind + 1) * step + rpref;
                        colspan = ostep;
                        // store related text
                        text = _cols[j].getValue(ind % unitsInParent[j]);
                    }
                }
                // setting last span
                if (colspan !== 0)
                    out[j][start] = { colspan, text };
            }
        }
        else {
            // for each scale
            for (let i = 0; i < _cols.length; i++) {
                const size = unitsInParent[i];
                const step = unitSizes[i];
                let ind = 0;
                // set value at n-th cell
                for (let j = rpref; j < fullLength; j += step) {
                    if (step === 1) {
                        out[i][j] = _cols[i].getValue(ind++);
                    }
                    else {
                        out[i][j] = { text: _cols[i].getValue(ind++), colspan: step };
                    }
                    // repeat dimension values
                    if (ind >= size)
                        ind = 0;
                }
            }
        }
        // add bottom line, with operations
        if (this._ops) {
            const opNames = new Array(fullLength);
            const step = _ops.length;
            for (let j = rpref; j < fullLength; j += step)
                for (let z = 0; z < step; z++)
                    opNames[j + z] = _opInfo[z].label;
            out.push(opNames);
        }
        // prepend row labels
        for (let i = 0; i < rpref; i++) {
            const rowspan = _cols.length + (this._ops ? 1 : 0);
            if (isNested) {
                out[0][0] = { text: "", rowspan };
                break;
            }
            const text = _rows[i].getLabel();
            out[0][i] = rowspan > 1 ? { text, rowspan } : text;
        }
        const res = { data: out };
        // add compression line to output
        if (nonEmpty)
            res.nonEmpty = line;
        if (meta) {
            const metaLine = new Array(fullLength);
            for (let i = 0; i < rpref; i++)
                metaLine[i] = _rows[i].getMeta();
            const step = _ops.length;
            for (let j = rpref; j < fullLength; j += step)
                for (let z = 0; z < step; z++)
                    metaLine[j + z] = _opInfo[z].meta;
            res.meta = metaLine;
        }
        return res;
    }
    filter(rules, master) {
        if (!rules || Object.keys(rules).length === 0) {
            if (!master && this._masterRules)
                rules = Object.assign(Object.assign({}, this._masterRules), rules);
            else {
                this._order = this._base_order;
                return;
            }
        }
        if (master)
            this._masterRules = rules;
        this._order = filter(this._base_order, this._table, rules, this._context);
    }
    operations(ops, groupOps) {
        const { _table, _order, _context } = this;
        ops = ops || [];
        this._ops = ops.map(p => optimize(_table, _order, typeof p === "string" ? p : p.math, _context.math));
        this._opInfo = ops.map(p => {
            if (typeof p === "string") {
                return { label: p, math: p };
            }
            else {
                return Object.assign(Object.assign({}, p), { label: p.label || p.math });
            }
        });
        this._groupOps = groupOps.map(ops => {
            return ops
                ? ops.map(p => optimizeGroup(typeof p === "string" ? p : p.math, _context.math))
                : null;
        });
        this._setSizes();
    }
    total(result, total) {
        const ops = total.map(p => optimizeGroup(typeof p === "string" ? p : p.math, this._context.math));
        if (result.tree) {
            const temp = { data: result.tree, values: [] };
            this._fillGroupRowInner(temp, 0, [ops], result.width);
            return temp.values;
        }
        else {
            return this._fillTotal(result.data, ops, result.width, result.scaleWidth);
        }
    }
    aggregateRows(result, ops) {
        const config = {};
        let exit = true;
        for (const key in ops) {
            const test = ops[key];
            config[key] = optimizeGroup(test, this._context.math);
            exit = false;
        }
        if (exit)
            return null;
        return this._filAggrRows(result.data, config, result.width, result.scaleWidth);
    }
    aggregateColumns(result, ops) {
        const config = {};
        let exit = true;
        for (const key in ops) {
            const test = ops[key];
            config[key] = optimizeGroup(test, this._context.math);
            exit = false;
        }
        if (exit)
            return null;
        return this._filAggrCols(result.data, config, result.width, result.scaleWidth);
    }
    mark(result, ops) {
        const order = [];
        for (const key in ops)
            order.push([key, ops[key]]);
        if (!order.length)
            return null;
        const out = [];
        const width = result.width;
        const obj = result.data;
        const len = obj.length;
        for (let j = 0; j < len; j++) {
            const marks = [];
            out.push(marks);
            for (let i = result.scaleWidth; i < width; i++) {
                const value = obj[j][i];
                if (typeof value !== "undefined") {
                    for (let z = 0; z < order.length; z++) {
                        const cm = order[z][1](value, result.allRows[i], result.allColumns[j]);
                        if (cm) {
                            if (marks[i])
                                marks[i].push(order[z][0]);
                            else
                                marks[i] = [order[z][0]];
                        }
                    }
                }
            }
        }
        return out;
    }
    _fillGroupRowInner(obj, level, maths, width) {
        const needNext = maths.length > level;
        const data = obj.data;
        if (needNext)
            for (let i = 0; i < obj.data.length; i++)
                this._fillGroupRowInner(data[i], level + 1, maths, width);
        const mline = maths[level];
        if (mline) {
            const step = this._ops.length;
            for (let i = 1; i <= width; i++) {
                const op = mline[(i - 1) % step];
                if (op) {
                    const arr = obj.data
                        .map(a => a.values[i])
                        .filter(a => typeof a !== "undefined");
                    if (arr.length > 0)
                        obj.values[i] = op(arr);
                }
            }
        }
    }
    _fillTotal(obj, mline, width, prefix) {
        const result = [];
        if (mline) {
            const step = this._ops.length;
            for (let i = prefix; i < width; i++) {
                const op = mline[(i - 1) % step];
                if (op) {
                    const arr = obj.map(a => a[i]).filter(a => typeof a !== "undefined");
                    if (arr.length > 0)
                        result[i] = op(arr);
                }
            }
        }
        return result;
    }
    _filAggrRows(obj, mline, width, prefix) {
        const result = [];
        if (mline) {
            for (let i = prefix; i < width; i++) {
                const arr = obj.map(a => a[i]).filter(a => typeof a !== "undefined");
                if (arr.length > 0) {
                    const t = (result[i] = {});
                    for (const key in mline) {
                        t[key] = mline[key](arr);
                    }
                }
            }
        }
        return result;
    }
    _filAggrCols(obj, mline, width, prefix) {
        const result = [];
        if (mline) {
            const height = obj.length;
            for (let i = 0; i < height; i++) {
                const arr = (prefix ? obj[i].slice(prefix) : obj[i]).filter(a => typeof a !== "undefined");
                if (arr.length > 0) {
                    const t = (result[i] = {});
                    for (const key in mline) {
                        t[key] = mline[key](arr);
                    }
                }
            }
        }
        return result;
    }
    _fillRow(out, from, to, dimsSize) {
        const { _cols, _group, _ops, _sizes, _rows } = this;
        const rl = _rows.length;
        // calculations
        if (_ops.length) {
            if (_cols.length) {
                let cfrom = from;
                while (cfrom < to) {
                    let cind = 0;
                    for (let i = 0; i < _cols.length; i++)
                        cind += _sizes[i] * _group[rl + i];
                    const cto = this._nextColumn();
                    for (let i = 0; i < _ops.length; i++) {
                        out[cind + dimsSize + i] = _ops[i](cfrom, cto);
                    }
                    this._cursor = cfrom = cto;
                }
            }
            else {
                for (let i = 0; i < _ops.length; i++)
                    out[i + dimsSize] = _ops[i](from, to);
            }
        }
    }
    _sort() {
        const { _table, _dims } = this;
        const size = Math.min(_table.count(), this._context.limit.raws);
        const order = new Array(size);
        for (let i = 0; i < size; i++) {
            order[i] = i;
        }
        const dimsSize = _dims.length;
        const dimsData = _dims.map(a => a.getIndexes());
        order.sort((a, b) => {
            for (let j = 0; j < dimsSize; j++) {
                const left = dimsData[j][a];
                const right = dimsData[j][b];
                if (left > right)
                    return 1;
                if (left < right)
                    return -1;
            }
            return 0;
        });
        return order;
    }
    _nextRow(silent) {
        const { _data, _order, _group, _rows } = this;
        const dimsSize = _rows.length;
        let ok = true;
        let to = this._cursor;
        // eslint-disable-next-line
        while (true) {
            const ind = _order[to];
            for (let i = 0; i < dimsSize; i++) {
                if (_data[i][ind] != _group[i]) {
                    if (!silent)
                        _group[i] = _data[i][ind];
                    ok = false;
                }
            }
            if (!ok)
                break;
            to++;
        }
        return to;
    }
    _nextColumn() {
        const { _data, _order, _group, _rows, _cols } = this;
        const dimsSize = _cols.length + _rows.length;
        let ok = true;
        let to = this._cursor;
        // eslint-disable-next-line
        while (true) {
            const ind = _order[to];
            for (let i = 0; i < dimsSize; i++) {
                if (_data[i][ind] != _group[i]) {
                    _group[i] = _data[i][ind];
                    ok = false;
                }
            }
            if (!ok)
                break;
            to++;
        }
        return to;
    }
    _setSizes() {
        const sizes = this._cols.map(a => a.getSize());
        let sum = this._ops.length || 1;
        for (let i = sizes.length - 1; i >= 0; i--) {
            const now = sum;
            sum *= sizes[i];
            sizes[i] = now;
        }
        this._sizes = sizes;
    }
}

class RawTable {
    constructor(config) {
        this._columns = config.fields;
        this.parse(config.data);
    }
    parse(data) {
        this._raw = data;
        this._parse_inner();
    }
    prepare() {
        if (this._prepared)
            return;
        this._prepared = true;
        const data = this._raw;
        const fields = this._columns;
        const cols = fields.filter(a => a.type === 3);
        if (!data || !cols.length)
            return;
        const dataLength = data.length;
        const columnsLength = cols.length;
        for (let i = 0; i < dataLength; i++) {
            for (let j = 0; j < columnsLength; j++) {
                const col = cols[j];
                const text = col.getter(i);
                if (typeof text === "string")
                    col.setter(i, new Date(text));
            }
        }
    }
    _parse_inner() {
        this._columns.forEach(a => {
            const key = a.id;
            a.getter = i => this._raw[i][key];
            a.setter = (i, v) => (this._raw[i][key] = v);
        });
    }
    getColumn(id) {
        return this._columns.find(a => a.id === id);
    }
    count() {
        return this._raw.length;
    }
}

class ColumnTable extends RawTable {
    parse(data) {
        this._parse_init(data.length);
        const dataLength = data.length;
        const columnsLength = this._columns.length;
        for (let i = 0; i < dataLength; i++) {
            const obj = data[i];
            for (let j = 0; j < columnsLength; j++) {
                const col = this._columns[j];
                col.data[i] = obj[col.id];
            }
        }
    }
    _parse_init(n) {
        this._columns.forEach(a => {
            const data = (a.data = new Array(n));
            a.getter = i => data[i];
            a.setter = (i, v) => (data[i] = v);
        });
    }
    count() {
        return this._columns[0].data.length;
    }
}

const methods = {
    round: (v) => Math.round(v),
    sum: (arr) => arr.reduce((acc, a) => acc + a, 0),
    min: (arr) => arr.reduce((acc, a) => (a < acc ? a : acc), arr.length ? arr[0] : 0),
    max: (arr) => arr.reduce((acc, a) => (a > acc ? a : acc), arr.length ? arr[0] : 0),
    avg: (arr) => arr.length ? arr.reduce((acc, a) => acc + a, 0) / arr.length : 0,
    wavg: (arr, w) => {
        if (!arr.length)
            return 0;
        let count = 0;
        let summ = 0;
        for (let i = arr.length - 1; i >= 0; i--) {
            count += w[i];
            summ += arr[i] * w[i];
        }
        return summ / count;
    },
    count: (arr) => arr.length,
    any: (arr) => (arr.length ? arr[0] : null),
};
const filters = {
    eq: (v) => (x) => x == v,
    neq: (v) => (x) => x != v,
    gt: (v) => (x) => x > v,
    gte: (v) => (x) => x >= v,
    lt: (v) => (x) => x < v,
    lte: (v) => (x) => x <= v,
    in: (v) => (x) => v[x],
    hasPrefix: (v) => (x) => x.indexOf(v) === 0,
    contains: (v) => (x) => x.indexOf(v) !== -1,
};
const predicates = {
    year: (v) => v.getFullYear(),
    month: (v) => v.getMonth(),
    day: (v) => v.getDay(),
    hour: (v) => v.getHours(),
    minute: (v) => v.getMinutes(),
};

class Analytic {
    constructor(cfg) {
        this._tables = {};
        this._dimensions = {};
        this._preds = Object.assign({}, predicates);
        this._maths = Object.assign({}, methods);
        this._comps = Object.assign({}, filters);
        if (cfg && cfg.tables)
            cfg.tables.forEach(s => this.addTable(s));
        if (cfg && cfg.dimensions)
            cfg.dimensions.forEach(s => this.addDimension(s));
    }
    addPredicate(name, code) {
        this._preds[name.toLowerCase()] = code;
    }
    addMath(name, code) {
        this._maths[name.toLowerCase()] = code;
    }
    addComparator(name, code) {
        this._comps[name.toLowerCase()] = code;
    }
    getDimension(id) {
        return this._dimensions[id];
    }
    addDimension(s) {
        if (this._dimensions[s.id])
            return;
        const table = this._tables[s.table];
        const getter = this._predicateGetter(table, s.rule.by);
        this._dimensions[s.id] = new DataDimension(table, getter, s.label || s.id, s.meta || s, s.sort);
    }
    resetDimensions(s, preserve) {
        const prev = this._dimensions;
        this._dimensions = {};
        if (s)
            s.forEach(a => {
                const used = prev[a.id];
                if (preserve && used)
                    this._dimensions[a.id] = used;
                else
                    this.addDimension(a);
            });
    }
    addTable(s) {
        const driver = (s.driver || "raw") === "raw" ? RawTable : ColumnTable;
        const t = (this._tables[s.id] = new driver(s));
        if (s.prepare)
            t.prepare();
    }
    getTable(id) {
        return this._tables[id];
    }
    compact(table, config) {
        const { rows, cols, filters, limit } = config;
        const base = this._tables[table];
        const rDims = rows ? rows.map(a => this._dimensions[a]) : [];
        const cDims = cols ? cols.map(a => this._dimensions[a]) : [];
        [...rDims, ...cDims].forEach(a => a.prepare());
        const pivot = new DataPivot(base, rDims, cDims, filters, {
            getter: this._predicateGetter.bind(this),
            math: this._maths,
            compare: this._comps,
            limit: Object.assign({ rows: 10000, columns: 5000, raws: Infinity }, (limit || {})),
        });
        return new DataExport(pivot);
    }
    _predicateGetter(table, key) {
        const find = key.indexOf("(");
        if (find !== -1) {
            const fn = this._preds[key.substr(0, find).toLowerCase()];
            key = key.substr(find + 1, key.length - find - 2);
            const getter = table.getColumn(key).getter;
            return i => fn(getter(i));
        }
        else {
            return table.getColumn(key).getter;
        }
    }
}

export { Analytic };
//# sourceMappingURL=rengine.es6.js.map
