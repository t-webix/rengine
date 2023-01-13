import { anyData, DataGetter, IDataDimension, IMetaInfo, ITable, sortHandler } from "./types";
export declare class DataDimension implements IDataDimension {
    private _indexes;
    private _values;
    private _prepared;
    private _label;
    private _meta;
    private _sort;
    private _table;
    private _keys;
    private _getter;
    constructor(table: ITable, getValue: DataGetter, label: string, meta?: IMetaInfo, sort?: "asc" | "desc" | sortHandler<anyData>);
    getIndexes(): number[];
    getValue(i: number): anyData;
    getSize(): number;
    getLabel(): string;
    getOptions(): anyData[];
    getMeta(): IMetaInfo;
    reset(): void;
    prepare(): void;
    private _prepareOptions;
}
