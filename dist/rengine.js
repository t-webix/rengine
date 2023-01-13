'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var asc = function (a, b) { return (a.key > b.key ? 1 : -1); };
var desc = function (a, b) { return (a.key < b.key ? 1 : -1); };
var DataDimension = /** @class */ (function () {
    function DataDimension(table, getValue, label, meta, sort) {
        if (sort === "desc") {
            this._sort = desc;
        }
        else if (sort === "asc") {
            this._sort = asc;
        }
        else if (sort) {
            this._sort = function (a, b) { return sort(a.key, b.key); };
        }
        this._label = label;
        this._meta = meta || null;
        this._table = table;
        this._getter = getValue;
        this._prepared = 0;
    }
    DataDimension.prototype.getIndexes = function () {
        return this._indexes;
    };
    DataDimension.prototype.getValue = function (i) {
        return this._values[i].key;
    };
    DataDimension.prototype.getSize = function () {
        return this._values.length;
    };
    DataDimension.prototype.getLabel = function () {
        return this._label;
    };
    DataDimension.prototype.getOptions = function () {
        this._prepareOptions();
        return this._values.map(function (a) { return a.key; });
    };
    DataDimension.prototype.getMeta = function () {
        return this._meta;
    };
    DataDimension.prototype.reset = function () {
        this._prepared = 0;
    };
    DataDimension.prototype.prepare = function () {
        // eslint-disable-next-line
        if (this._prepared & 1)
            return;
        // eslint-disable-next-line
        this._prepared = this._prepared | 1;
        this._prepareOptions();
        var _a = this, _table = _a._table, _getter = _a._getter, _keys = _a._keys;
        var fSize = _table.count();
        this._values.forEach(function (a, i) { return (a.index = i); });
        var indexes = (this._indexes = new Array(fSize));
        for (var i = 0; i < fSize; i++) {
            var key = _getter(i);
            indexes[i] = _keys.get(key).index;
        }
    };
    DataDimension.prototype._prepareOptions = function () {
        // eslint-disable-next-line
        if (this._prepared & 2)
            return;
        // eslint-disable-next-line
        this._prepared = this._prepared | 2;
        var _a = this, _table = _a._table, _getter = _a._getter;
        var fSize = _table.count();
        var keys = (this._keys = new Map());
        var values = (this._values = []);
        for (var i = 0; i < fSize; i++) {
            var key = _getter(i);
            var index = keys.get(key);
            if (typeof index === "undefined") {
                keys.set(key, (values[values.length] = { key: key, index: 0 }));
            }
        }
        if (this._sort)
            values.sort(this._sort);
    };
    return DataDimension;
}());

var DataExport = /** @class */ (function () {
    function DataExport(pivot) {
        this._pivot = pivot;
    }
    DataExport.prototype.toArray = function (_a) {
        var cleanRows = _a.cleanRows, filters = _a.filters, ops = _a.ops, total = _a.total, marks = _a.marks, aggregateRows = _a.aggregateRows, aggregateColumns = _a.aggregateColumns;
        var row;
        var out = [];
        var limit = this._pivot.getLimit();
        var maxRow = limit.rows || 0;
        this._pivot.filter(filters);
        this._pivot.operations(ops, []);
        this._pivot.resetCursor();
        var count = 0;
        while ((row = this._pivot.next())) {
            out.push(row);
            count++;
            if (maxRow === count)
                break;
        }
        var _b = this._pivot.getWidth(), scaleWidth = _b[0], width = _b[1];
        if (cleanRows)
            this._cleanRows(out, scaleWidth);
        var result = {
            data: out,
            width: width + scaleWidth,
            scaleWidth: scaleWidth,
        };
        if (total)
            result.total = this._pivot.total(result, total);
        result.allRows = this._pivot.aggregateRows(result, aggregateRows) || [];
        result.allColumns =
            this._pivot.aggregateColumns(result, aggregateColumns) || [];
        if (marks)
            result.marks = this._pivot.mark(result, marks);
        return result;
    };
    DataExport.prototype.toNested = function (_a) {
        var filters = _a.filters, ops = _a.ops, groupOps = _a.groupOps, total = _a.total, aggregateRows = _a.aggregateRows, aggregateColumns = _a.aggregateColumns, marks = _a.marks;
        this._pivot.filter(filters);
        this._pivot.operations(ops, groupOps || []);
        this._pivot.resetCursor();
        var result = this._pivot.nested();
        if (total)
            result.total = this._pivot.total(result, total);
        result.allRows = this._pivot.aggregateRows(result, aggregateRows) || [];
        result.allColumns =
            this._pivot.aggregateColumns(result, aggregateColumns) || [];
        if (marks)
            result.marks = this._pivot.mark(result, marks);
        return result;
    };
    DataExport.prototype.toXHeader = function (data, config) {
        return this._pivot.getXHeader(data, config);
    };
    DataExport.prototype._cleanRows = function (data, rowsLength) {
        var count = data.length;
        var prev = new Array(rowsLength);
        for (var j = 0; j < count; j++) {
            var row = data[j];
            for (var i = 0; i < rowsLength; i++) {
                if (prev[i] !== row[i]) {
                    for (var j_1 = i; j_1 < rowsLength; j_1++)
                        prev[j_1] = row[j_1];
                    break;
                }
                row[i] = "";
            }
        }
    };
    return DataExport;
}());

function t(t,e){let n="";const o=t.length;let r=0,i=!1,s=!1,u=0;for(;r<o;){const o=t[r];if(r++,'"'===o)i?n+=t.substr(u,r-u):u=r-1,i=!i;else {if(i)continue;const c=","===o||"/"===o||"*"===o||"+"===o||"-"===o||"("===o||")"===o,f=" "===o||"\t"===o||" \n"===o||"\r"===o;if(s){if(!c&&!f)continue;{const i=t.substr(u,r-u-1);n+="("===o?e.method(i):e.property(i),s=!1;}}if(f)continue;if(c)n+=o;else {"0"===o||"1"===o||"2"===o||"3"===o||"4"===o||"5"===o||"6"===o||"7"===o||"8"===o||"9"===o?n+=o:(s=!0,u=r-1);}}}return s&&(n+=e.property(t.substr(u,r-u))),n}function e(e,n){return new Function(n.propertyName,n.methodName,n.contextName,"return "+t(e,n))}

function optimize(table, order, code, allMath) {
    var math = getMath(table, code);
    var ctx = {
        table: table,
        order: order,
        from: 0,
        to: 0,
        array: function (i, c) {
            var size = c.to - c.from;
            var temp = new Array(size);
            var getter = cache[i];
            for (var j = 0; j < size; j++) {
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
    var math = getGroupMath(code);
    return function (v) {
        return math(v, allMath, null);
    };
}
var id = 0;
var cache = [];
function getMath(table, rule) {
    return e(rule, {
        propertyName: "d",
        methodName: "m",
        contextName: "c",
        property: function (a) {
            var i = id;
            cache[i] = table.getColumn(a).getter;
            id += 1;
            return "c.array(\"" + i + "\", c)";
        },
        method: function (a) {
            return "m." + a.toLowerCase();
        },
    });
}
function getGroupMath(rule) {
    return e(rule, {
        propertyName: "d",
        methodName: "m",
        contextName: "c",
        property: function () {
            return "d";
        },
        method: function (a) {
            return "m." + a.toLowerCase();
        },
    });
}

var and = function (a, b) { return function (c) { return a(c) && b(c); }; };
function buildFinder(data, key, value, context) {
    var getValue = context.getter(data, key);
    if (typeof value !== "object") {
        var check_1 = context.compare["eq"](value);
        return function (i) { return check_1(getValue(i)); };
    }
    else {
        var ops = Object.keys(value);
        var result = null;
        var _loop_1 = function (i) {
            var check = context.compare[ops[i].toLowerCase()](value[ops[i]]);
            var step = function (i) { return check(getValue(i)); };
            result = result ? and(result, step) : step;
        };
        for (var i = 0; i < ops.length; i++) {
            _loop_1(i);
        }
        return result;
    }
}
function build(table, rule, context) {
    var keys = Object.keys(rule);
    var result = null;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var step = buildFinder(table, key, rule[key], context);
        result = result ? and(result, step) : step;
    }
    return result;
}
function filter(order, table, rule, context) {
    var filter = build(table, rule, context);
    return order.filter(function (n) { return filter(n); });
}

var DataPivot = /** @class */ (function () {
    function DataPivot(table, rows, cols, filters, config) {
        this._rows = rows;
        this._cols = cols;
        this._dims = rows.concat(cols);
        this._table = table;
        this._context = config;
        this._cursor = -1;
        this._order = this._base_order = this._sort();
        this._data = this._dims.map(function (a) { return a.getIndexes(); });
        this.filter(filters, true);
    }
    DataPivot.prototype.resetCursor = function () {
        this._cursor = 0;
        this._group = this._dims.map(function () { return null; });
        if (this._order.length) {
            if (this._rows.length)
                this._nextRow();
            if (this._cols.length)
                this._nextColumn();
        }
    };
    DataPivot.prototype.next = function () {
        var _a = this, _cursor = _a._cursor, _cols = _a._cols, _order = _a._order, _group = _a._group, _ops = _a._ops, _rows = _a._rows;
        if (this._cursor >= _order.length)
            return null;
        var dimsSize = _rows.length;
        var out = new Array(dimsSize + _ops.length * _cols.length);
        // dimensions
        for (var i = 0; i < dimsSize; i++)
            out[i] = _rows[i].getValue(_group[i]);
        // get end of next line ( all dataset for columns mode )
        var to = this._rows.length
            ? this._nextRow(_cols.length > 0)
            : _order.length;
        this._fillRow(out, _cursor, to, dimsSize);
        this._cursor = to;
        return out;
    };
    DataPivot.prototype.nested = function () {
        var _a = this, _cols = _a._cols, _order = _a._order, _rows = _a._rows;
        var dimSize = _rows.length;
        var dimOutSize = dimSize > 0 ? 1 : 0;
        var levels = [{ data: [], values: [] }];
        var starts = _rows.map(function () { return 0; });
        var data = [];
        var prev = [];
        var now = [];
        var from = this._cursor;
        var count = 0;
        var limit = this._context.limit.rows;
        var width = Math.min(this._context.limit.columns, (_cols.length ? this._sizes[0] * _cols[0].getSize() : 0) + dimOutSize);
        while (this._cursor < _order.length) {
            var out = new Array(width);
            prev = now;
            now = [].concat(this._group);
            // get end of next line ( all dataset for columns mode )
            var to = this._rows.length
                ? this._nextRow(_cols.length > 0)
                : _order.length;
            this._fillRow(out, from, to, dimOutSize);
            if (dimSize > 0) {
                for (var level = 0; level < dimSize; level++) {
                    if (now[level] != prev[level]) {
                        for (var j = level; j < dimSize; j++) {
                            var index = j + 1;
                            var last = index === dimSize;
                            var obj = (levels[index] = {
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
        this._fillGroupRowInner(levels[0], 0, __spreadArrays([null], this._groupOps).slice(0, _rows.length), width);
        return { tree: levels[0].data, data: data, width: width, scaleWidth: dimOutSize };
    };
    DataPivot.prototype.getLimit = function () {
        return this._context.limit;
    };
    DataPivot.prototype.getWidth = function () {
        return [
            this._rows.length,
            this._cols.length && this._ops.length
                ? this._cols[0].getSize() * this._sizes[0]
                : 0,
        ];
    };
    DataPivot.prototype.getXHeader = function (result, hConfig) {
        var _a = this, _cols = _a._cols, _rows = _a._rows, _ops = _a._ops, _opInfo = _a._opInfo;
        var _b = hConfig || {}, nonEmpty = _b.nonEmpty, meta = _b.meta;
        var data = result.data;
        var isNested = result.tree;
        // compressed line
        var line = [];
        // rows prefix
        var rpref = result.tree ? Math.min(_rows.length, 1) : _rows.length;
        // count of operations, repeat step of bottom scale
        var ostep = _ops.length;
        // how many scale units in one parent
        var unitsInParent = _cols.map(function (a) { return a.getSize(); });
        // calculate full width of data
        var length = unitsInParent.reduce(function (prev, value) { return prev * value; }, ostep);
        var fullLength = Math.min(rpref + length, this._context.limit.columns);
        // how many data points per unit
        var temp = length;
        var unitSizes = unitsInParent.map(function (a) { return (temp = temp / a); });
        // result header
        var out = [];
        this._cols.forEach(function () { return out.push(new Array(fullLength)); });
        // build compressed order
        if (nonEmpty) {
            //check all cells, include columns of cells with data
            for (var i = 0; i < rpref; i++)
                line.push(i);
            for (var j = rpref; j < fullLength; j += ostep) {
                outer: for (var i = 0; i < data.length; i++) {
                    if (typeof data[i][j] !== "undefined") {
                        for (var i_1 = 0; i_1 < _ops.length; i_1++)
                            line.push(j + i_1);
                        break outer;
                    }
                }
            }
            // now check each scale line
            for (var j = 0; j < _cols.length; j++) {
                var step = unitSizes[j];
                var start = -1;
                var end = 0;
                var colspan = 0;
                var text = void 0;
                // against each non-empty column
                for (var i = rpref; i < line.length; i += ostep) {
                    var test = line[i];
                    // if we inside of span
                    if (test < end) {
                        colspan += ostep;
                    }
                    else {
                        // we have reached the new span
                        // setting old one if any
                        if (colspan !== 0) {
                            out[j][start] = { colspan: colspan, text: text };
                        }
                        // store position of new span
                        var ind = Math.floor((test - rpref) / step);
                        start = test;
                        end = (ind + 1) * step + rpref;
                        colspan = ostep;
                        // store related text
                        text = _cols[j].getValue(ind % unitsInParent[j]);
                    }
                }
                // setting last span
                if (colspan !== 0)
                    out[j][start] = { colspan: colspan, text: text };
            }
        }
        else {
            // for each scale
            for (var i = 0; i < _cols.length; i++) {
                var size = unitsInParent[i];
                var step = unitSizes[i];
                var ind = 0;
                // set value at n-th cell
                for (var j = rpref; j < fullLength; j += step) {
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
            var opNames = new Array(fullLength);
            var step = _ops.length;
            for (var j = rpref; j < fullLength; j += step)
                for (var z = 0; z < step; z++)
                    opNames[j + z] = _opInfo[z].label;
            out.push(opNames);
        }
        // prepend row labels
        for (var i = 0; i < rpref; i++) {
            var rowspan = _cols.length + (this._ops ? 1 : 0);
            if (isNested) {
                out[0][0] = { text: "", rowspan: rowspan };
                break;
            }
            var text = _rows[i].getLabel();
            out[0][i] = rowspan > 1 ? { text: text, rowspan: rowspan } : text;
        }
        var res = { data: out };
        // add compression line to output
        if (nonEmpty)
            res.nonEmpty = line;
        if (meta) {
            var metaLine = new Array(fullLength);
            for (var i = 0; i < rpref; i++)
                metaLine[i] = _rows[i].getMeta();
            var step = _ops.length;
            for (var j = rpref; j < fullLength; j += step)
                for (var z = 0; z < step; z++)
                    metaLine[j + z] = _opInfo[z].meta;
            res.meta = metaLine;
        }
        return res;
    };
    DataPivot.prototype.filter = function (rules, master) {
        if (!rules || Object.keys(rules).length === 0) {
            if (!master && this._masterRules)
                rules = __assign(__assign({}, this._masterRules), rules);
            else {
                this._order = this._base_order;
                return;
            }
        }
        if (master)
            this._masterRules = rules;
        this._order = filter(this._base_order, this._table, rules, this._context);
    };
    DataPivot.prototype.operations = function (ops, groupOps) {
        var _a = this, _table = _a._table, _order = _a._order, _context = _a._context;
        ops = ops || [];
        this._ops = ops.map(function (p) {
            return optimize(_table, _order, typeof p === "string" ? p : p.math, _context.math);
        });
        this._opInfo = ops.map(function (p) {
            if (typeof p === "string") {
                return { label: p, math: p };
            }
            else {
                return __assign(__assign({}, p), { label: p.label || p.math });
            }
        });
        this._groupOps = groupOps.map(function (ops) {
            return ops
                ? ops.map(function (p) {
                    return optimizeGroup(typeof p === "string" ? p : p.math, _context.math);
                })
                : null;
        });
        this._setSizes();
    };
    DataPivot.prototype.total = function (result, total) {
        var _this = this;
        var ops = total.map(function (p) {
            return optimizeGroup(typeof p === "string" ? p : p.math, _this._context.math);
        });
        if (result.tree) {
            var temp = { data: result.tree, values: [] };
            this._fillGroupRowInner(temp, 0, [ops], result.width);
            return temp.values;
        }
        else {
            return this._fillTotal(result.data, ops, result.width, result.scaleWidth);
        }
    };
    DataPivot.prototype.aggregateRows = function (result, ops) {
        var config = {};
        var exit = true;
        for (var key in ops) {
            var test = ops[key];
            config[key] = optimizeGroup(test, this._context.math);
            exit = false;
        }
        if (exit)
            return null;
        return this._filAggrRows(result.data, config, result.width, result.scaleWidth);
    };
    DataPivot.prototype.aggregateColumns = function (result, ops) {
        var config = {};
        var exit = true;
        for (var key in ops) {
            var test = ops[key];
            config[key] = optimizeGroup(test, this._context.math);
            exit = false;
        }
        if (exit)
            return null;
        return this._filAggrCols(result.data, config, result.width, result.scaleWidth);
    };
    DataPivot.prototype.mark = function (result, ops) {
        var order = [];
        for (var key in ops)
            order.push([key, ops[key]]);
        if (!order.length)
            return null;
        var out = [];
        var width = result.width;
        var obj = result.data;
        var len = obj.length;
        for (var j = 0; j < len; j++) {
            var marks = [];
            out.push(marks);
            for (var i = result.scaleWidth; i < width; i++) {
                var value = obj[j][i];
                if (typeof value !== "undefined") {
                    for (var z = 0; z < order.length; z++) {
                        var cm = order[z][1](value, result.allRows[i], result.allColumns[j]);
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
    };
    DataPivot.prototype._fillGroupRowInner = function (obj, level, maths, width) {
        var needNext = maths.length > level;
        var data = obj.data;
        if (needNext)
            for (var i = 0; i < obj.data.length; i++)
                this._fillGroupRowInner(data[i], level + 1, maths, width);
        var mline = maths[level];
        if (mline) {
            var step = this._ops.length;
            var _loop_1 = function (i) {
                var op = mline[(i - 1) % step];
                if (op) {
                    var arr = obj.data
                        .map(function (a) { return a.values[i]; })
                        .filter(function (a) { return typeof a !== "undefined"; });
                    if (arr.length > 0)
                        obj.values[i] = op(arr);
                }
            };
            for (var i = 1; i <= width; i++) {
                _loop_1(i);
            }
        }
    };
    DataPivot.prototype._fillTotal = function (obj, mline, width, prefix) {
        var result = [];
        if (mline) {
            var step = this._ops.length;
            var _loop_2 = function (i) {
                var op = mline[(i - 1) % step];
                if (op) {
                    var arr = obj.map(function (a) { return a[i]; }).filter(function (a) { return typeof a !== "undefined"; });
                    if (arr.length > 0)
                        result[i] = op(arr);
                }
            };
            for (var i = prefix; i < width; i++) {
                _loop_2(i);
            }
        }
        return result;
    };
    DataPivot.prototype._filAggrRows = function (obj, mline, width, prefix) {
        var result = [];
        if (mline) {
            var _loop_3 = function (i) {
                var arr = obj.map(function (a) { return a[i]; }).filter(function (a) { return typeof a !== "undefined"; });
                if (arr.length > 0) {
                    var t = (result[i] = {});
                    for (var key in mline) {
                        t[key] = mline[key](arr);
                    }
                }
            };
            for (var i = prefix; i < width; i++) {
                _loop_3(i);
            }
        }
        return result;
    };
    DataPivot.prototype._filAggrCols = function (obj, mline, width, prefix) {
        var result = [];
        if (mline) {
            var height = obj.length;
            for (var i = 0; i < height; i++) {
                var arr = (prefix ? obj[i].slice(prefix) : obj[i]).filter(function (a) { return typeof a !== "undefined"; });
                if (arr.length > 0) {
                    var t = (result[i] = {});
                    for (var key in mline) {
                        t[key] = mline[key](arr);
                    }
                }
            }
        }
        return result;
    };
    DataPivot.prototype._fillRow = function (out, from, to, dimsSize) {
        var _a = this, _cols = _a._cols, _group = _a._group, _ops = _a._ops, _sizes = _a._sizes, _rows = _a._rows;
        var rl = _rows.length;
        // calculations
        if (_ops.length) {
            if (_cols.length) {
                var cfrom = from;
                while (cfrom < to) {
                    var cind = 0;
                    for (var i = 0; i < _cols.length; i++)
                        cind += _sizes[i] * _group[rl + i];
                    var cto = this._nextColumn();
                    for (var i = 0; i < _ops.length; i++) {
                        out[cind + dimsSize + i] = _ops[i](cfrom, cto);
                    }
                    this._cursor = cfrom = cto;
                }
            }
            else {
                for (var i = 0; i < _ops.length; i++)
                    out[i + dimsSize] = _ops[i](from, to);
            }
        }
    };
    DataPivot.prototype._sort = function () {
        var _a = this, _table = _a._table, _dims = _a._dims;
        var size = Math.min(_table.count(), this._context.limit.raws);
        var order = new Array(size);
        for (var i = 0; i < size; i++) {
            order[i] = i;
        }
        var dimsSize = _dims.length;
        var dimsData = _dims.map(function (a) { return a.getIndexes(); });
        order.sort(function (a, b) {
            for (var j = 0; j < dimsSize; j++) {
                var left = dimsData[j][a];
                var right = dimsData[j][b];
                if (left > right)
                    return 1;
                if (left < right)
                    return -1;
            }
            return 0;
        });
        return order;
    };
    DataPivot.prototype._nextRow = function (silent) {
        var _a = this, _data = _a._data, _order = _a._order, _group = _a._group, _rows = _a._rows;
        var dimsSize = _rows.length;
        var ok = true;
        var to = this._cursor;
        // eslint-disable-next-line
        while (true) {
            var ind = _order[to];
            for (var i = 0; i < dimsSize; i++) {
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
    };
    DataPivot.prototype._nextColumn = function () {
        var _a = this, _data = _a._data, _order = _a._order, _group = _a._group, _rows = _a._rows, _cols = _a._cols;
        var dimsSize = _cols.length + _rows.length;
        var ok = true;
        var to = this._cursor;
        // eslint-disable-next-line
        while (true) {
            var ind = _order[to];
            for (var i = 0; i < dimsSize; i++) {
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
    };
    DataPivot.prototype._setSizes = function () {
        var sizes = this._cols.map(function (a) { return a.getSize(); });
        var sum = this._ops.length || 1;
        for (var i = sizes.length - 1; i >= 0; i--) {
            var now = sum;
            sum *= sizes[i];
            sizes[i] = now;
        }
        this._sizes = sizes;
    };
    return DataPivot;
}());

var RawTable = /** @class */ (function () {
    function RawTable(config) {
        this._columns = config.fields;
        this.parse(config.data);
    }
    RawTable.prototype.parse = function (data) {
        this._raw = data;
        this._parse_inner();
    };
    RawTable.prototype.prepare = function () {
        if (this._prepared)
            return;
        this._prepared = true;
        var data = this._raw;
        var fields = this._columns;
        var cols = fields.filter(function (a) { return a.type === 3; });
        if (!data || !cols.length)
            return;
        var dataLength = data.length;
        var columnsLength = cols.length;
        for (var i = 0; i < dataLength; i++) {
            for (var j = 0; j < columnsLength; j++) {
                var col = cols[j];
                var text = col.getter(i);
                if (typeof text === "string")
                    col.setter(i, new Date(text));
            }
        }
    };
    RawTable.prototype._parse_inner = function () {
        var _this = this;
        this._columns.forEach(function (a) {
            var key = a.id;
            a.getter = function (i) { return _this._raw[i][key]; };
            a.setter = function (i, v) { return (_this._raw[i][key] = v); };
        });
    };
    RawTable.prototype.getColumn = function (id) {
        return this._columns.find(function (a) { return a.id === id; });
    };
    RawTable.prototype.count = function () {
        return this._raw.length;
    };
    return RawTable;
}());

var ColumnTable = /** @class */ (function (_super) {
    __extends(ColumnTable, _super);
    function ColumnTable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ColumnTable.prototype.parse = function (data) {
        this._parse_init(data.length);
        var dataLength = data.length;
        var columnsLength = this._columns.length;
        for (var i = 0; i < dataLength; i++) {
            var obj = data[i];
            for (var j = 0; j < columnsLength; j++) {
                var col = this._columns[j];
                col.data[i] = obj[col.id];
            }
        }
    };
    ColumnTable.prototype._parse_init = function (n) {
        this._columns.forEach(function (a) {
            var data = (a.data = new Array(n));
            a.getter = function (i) { return data[i]; };
            a.setter = function (i, v) { return (data[i] = v); };
        });
    };
    ColumnTable.prototype.count = function () {
        return this._columns[0].data.length;
    };
    return ColumnTable;
}(RawTable));

var methods = {
    round: function (v) { return Math.round(v); },
    sum: function (arr) { return arr.reduce(function (acc, a) { return acc + a; }, 0); },
    min: function (arr) {
        return arr.reduce(function (acc, a) { return (a < acc ? a : acc); }, arr.length ? arr[0] : 0);
    },
    max: function (arr) {
        return arr.reduce(function (acc, a) { return (a > acc ? a : acc); }, arr.length ? arr[0] : 0);
    },
    avg: function (arr) {
        return arr.length ? arr.reduce(function (acc, a) { return acc + a; }, 0) / arr.length : 0;
    },
    wavg: function (arr, w) {
        if (!arr.length)
            return 0;
        var count = 0;
        var summ = 0;
        for (var i = arr.length - 1; i >= 0; i--) {
            count += w[i];
            summ += arr[i] * w[i];
        }
        return summ / count;
    },
    count: function (arr) { return arr.length; },
    any: function (arr) { return (arr.length ? arr[0] : null); },
};
var filters = {
    eq: function (v) { return function (x) { return x == v; }; },
    neq: function (v) { return function (x) { return x != v; }; },
    gt: function (v) { return function (x) { return x > v; }; },
    gte: function (v) { return function (x) { return x >= v; }; },
    lt: function (v) { return function (x) { return x < v; }; },
    lte: function (v) { return function (x) { return x <= v; }; },
    in: function (v) { return function (x) {
        return v[x];
    }; },
    hasPrefix: function (v) { return function (x) {
        return x.indexOf(v) === 0;
    }; },
    contains: function (v) { return function (x) {
        return x.indexOf(v) !== -1;
    }; },
};
var predicates = {
    year: function (v) { return v.getFullYear(); },
    month: function (v) { return v.getMonth(); },
    day: function (v) { return v.getDay(); },
    hour: function (v) { return v.getHours(); },
    minute: function (v) { return v.getMinutes(); },
};

var Analytic = /** @class */ (function () {
    function Analytic(cfg) {
        var _this = this;
        this._tables = {};
        this._dimensions = {};
        this._preds = __assign({}, predicates);
        this._maths = __assign({}, methods);
        this._comps = __assign({}, filters);
        if (cfg && cfg.tables)
            cfg.tables.forEach(function (s) { return _this.addTable(s); });
        if (cfg && cfg.dimensions)
            cfg.dimensions.forEach(function (s) { return _this.addDimension(s); });
    }
    Analytic.prototype.addPredicate = function (name, code) {
        this._preds[name.toLowerCase()] = code;
    };
    Analytic.prototype.addMath = function (name, code) {
        this._maths[name.toLowerCase()] = code;
    };
    Analytic.prototype.addComparator = function (name, code) {
        this._comps[name.toLowerCase()] = code;
    };
    Analytic.prototype.getDimension = function (id) {
        return this._dimensions[id];
    };
    Analytic.prototype.addDimension = function (s) {
        if (this._dimensions[s.id])
            return;
        var table = this._tables[s.table];
        var getter = this._predicateGetter(table, s.rule.by);
        this._dimensions[s.id] = new DataDimension(table, getter, s.label || s.id, s.meta || s, s.sort);
    };
    Analytic.prototype.resetDimensions = function (s, preserve) {
        var _this = this;
        var prev = this._dimensions;
        this._dimensions = {};
        if (s)
            s.forEach(function (a) {
                var used = prev[a.id];
                if (preserve && used)
                    _this._dimensions[a.id] = used;
                else
                    _this.addDimension(a);
            });
    };
    Analytic.prototype.addTable = function (s) {
        var driver = (s.driver || "raw") === "raw" ? RawTable : ColumnTable;
        var t = (this._tables[s.id] = new driver(s));
        if (s.prepare)
            t.prepare();
    };
    Analytic.prototype.getTable = function (id) {
        return this._tables[id];
    };
    Analytic.prototype.compact = function (table, config) {
        var _this = this;
        var rows = config.rows, cols = config.cols, filters = config.filters, limit = config.limit;
        var base = this._tables[table];
        var rDims = rows ? rows.map(function (a) { return _this._dimensions[a]; }) : [];
        var cDims = cols ? cols.map(function (a) { return _this._dimensions[a]; }) : [];
        __spreadArrays(rDims, cDims).forEach(function (a) { return a.prepare(); });
        var pivot = new DataPivot(base, rDims, cDims, filters, {
            getter: this._predicateGetter.bind(this),
            math: this._maths,
            compare: this._comps,
            limit: __assign({ rows: 10000, columns: 5000, raws: Infinity }, (limit || {})),
        });
        return new DataExport(pivot);
    };
    Analytic.prototype._predicateGetter = function (table, key) {
        var find = key.indexOf("(");
        if (find !== -1) {
            var fn_1 = this._preds[key.substr(0, find).toLowerCase()];
            key = key.substr(find + 1, key.length - find - 2);
            var getter_1 = table.getColumn(key).getter;
            return function (i) { return fn_1(getter_1(i)); };
        }
        else {
            return table.getColumn(key).getter;
        }
    };
    return Analytic;
}());

exports.Analytic = Analytic;
//# sourceMappingURL=rengine.js.map
