import DataPivot from "./DataPivot";
import { anyData, ExportConfig, exportResult, headerConfig, headerResult } from "./types";
export default class DataExport {
    private _pivot;
    constructor(pivot: DataPivot);
    toArray({ cleanRows, filters, ops, total, marks, aggregateRows, aggregateColumns, }: ExportConfig): exportResult;
    toNested({ filters, ops, groupOps, total, aggregateRows, aggregateColumns, marks, }: ExportConfig): exportResult;
    toXHeader(data?: exportResult, config?: headerConfig): headerResult;
    _cleanRows(data: anyData[][], rowsLength: number): void;
}
