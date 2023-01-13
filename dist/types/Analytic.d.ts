import DataExport from "./DataExport";
import { TableConfig, DimensionConfig, IAnalyticConfig, CompactConfig, DataTransformer, ITable, AggrFunction, MathFunction, FilterBlock, IDataDimension } from "./types";
export declare class Analytic {
    private _tables;
    private _dimensions;
    private _preds;
    private _maths;
    private _comps;
    constructor(cfg?: IAnalyticConfig);
    addPredicate(name: string, code: DataTransformer): void;
    addMath(name: string, code: AggrFunction | MathFunction): void;
    addComparator(name: string, code: FilterBlock): void;
    getDimension(id: string): IDataDimension;
    addDimension(s: DimensionConfig): void;
    resetDimensions(s?: DimensionConfig[], preserve?: boolean): void;
    addTable(s: TableConfig): void;
    getTable(id: string): ITable;
    compact(table: string, config: CompactConfig): DataExport;
    private _predicateGetter;
}
