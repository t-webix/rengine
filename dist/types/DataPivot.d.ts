import { ITable, FilterConfig, IDataDimension, anyData, OperationConfig, PivotContext, exportResult, headerResult, GroupOps, headerConfig, LimitConfig, markOperation, StringHash } from "./types";
export default class DataPivot {
    private _rows;
    private _cols;
    private _dims;
    private _ops;
    private _groupOps;
    private _opInfo;
    private _table;
    private _group;
    private _cursor;
    private _order;
    private _base_order;
    private _data;
    private _context;
    private _sizes;
    private _masterRules;
    constructor(table: ITable, rows: IDataDimension[], cols: IDataDimension[], filters: FilterConfig, config: PivotContext);
    resetCursor(): void;
    next(): (number | string)[];
    nested(): exportResult;
    getLimit(): LimitConfig;
    getWidth(): [number, number];
    getXHeader(result: exportResult, hConfig?: headerConfig): headerResult;
    filter(rules: FilterConfig, master?: boolean): void;
    operations(ops: (string | OperationConfig)[], groupOps: GroupOps): void;
    total(result: exportResult, total: (string | OperationConfig)[]): anyData[];
    aggregateRows(result: exportResult, ops: {
        [name: string]: string;
    }): StringHash<number>[];
    aggregateColumns(result: exportResult, ops: {
        [name: string]: string;
    }): StringHash<number>[];
    mark(result: exportResult, ops: StringHash<markOperation>): string[][][];
    private _fillGroupRowInner;
    private _fillTotal;
    private _filAggrRows;
    private _filAggrCols;
    private _fillRow;
    private _sort;
    private _nextRow;
    private _nextColumn;
    private _setSizes;
}
