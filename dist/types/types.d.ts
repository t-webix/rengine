export declare type anyData = number | string | Date;
export declare type anyObject = {
    [name: string]: anyData;
};
export declare type filterData = number | string | Date | {
    [name: string]: boolean;
};
export declare type nestedData = {
    id?: number;
    data: nestedData[];
    values?: anyData[];
};
export declare type exportResult = {
    tree?: nestedData[];
    data: anyData[][];
    total?: anyData[];
    width: number;
    scaleWidth: number;
    allRows?: StringHash<number>[];
    allColumns?: StringHash<number>[];
    marks?: string[][][];
};
export declare type headerConfig = {
    nonEmpty?: boolean;
    meta?: boolean;
};
export interface IMetaInfo {
}
export declare type headerData = number | string | Date | {
    text: anyData;
    colspan?: number;
    rowspan?: number;
};
export declare type headerResult = {
    data: headerData[][];
    nonEmpty?: number[];
    meta?: IMetaInfo[];
};
export declare type ExportConfig = {
    ops?: (string | OperationConfig)[];
    groupOps?: (string | OperationConfig)[][];
    filters?: FilterConfig;
    cleanRows?: boolean;
    total?: (string | OperationConfig)[];
    marks?: StringHash<markOperation>;
    aggregateRows?: StringHash<string>;
    aggregateColumns?: StringHash<string>;
};
export declare type OperationConfig = {
    math: string;
    label?: string;
    meta?: IMetaInfo;
};
export declare type GroupOps = (string | OperationConfig)[][];
export declare type CompactConfig = {
    filters: FilterConfig;
    rows: string[];
    cols: string[];
    limit: LimitConfig;
};
export declare type LimitConfig = {
    rows?: number;
    columns?: number;
    raws?: number;
};
export declare type StringHash<T> = {
    [name: string]: T;
};
export declare type TablesHash = {
    [name: string]: ITable;
};
export declare type DataDimensionHash = {
    [name: string]: IDataDimension;
};
export interface IDataDimension {
    getIndexes(): number[];
    getValue(i: number): anyData;
    getSize(): number;
    getLabel(): string;
    getOptions(): anyData[];
    getMeta(): IMetaInfo;
    reset(): void;
    prepare(): void;
}
export interface IAnalyticConfig {
    tables?: TableConfig[];
    dimensions: DimensionConfig[];
}
export interface FilterRule {
    [name: string]: anyData;
}
export declare type DataGetter = {
    (i: number): anyData;
};
export declare type DataSetter = {
    (i: number, value: anyData): void;
};
export declare type DataChooser = {
    (i: number): boolean;
};
export declare type DataIterator = {
    (v: anyData[][], i: number): void;
};
export declare type DataTransformer = {
    (v: anyData): anyData;
};
export declare type DataTransformerHash = {
    [name: string]: DataTransformer;
};
export declare type fastOperation = {
    (from: number, to: number): number;
};
export declare type groupOperation = {
    (data: anyData[]): number;
};
export declare type markOperation = {
    (data: anyData, allRows: StringHash<number>, allColumns: StringHash<number>): string;
};
export interface MetaField {
    id: string;
    type: number;
    data?: anyData[];
    getter?: DataGetter;
    setter?: DataSetter;
}
export interface ITable {
    count(): number;
    prepare(): void;
    parse(data: anyObject[]): void;
    getColumn(key: string): MetaField;
}
export interface IDataView {
    table: ITable;
    order: number[];
}
export interface TableConfig {
    id: string;
    name?: string;
    fields: MetaField[];
    data?: anyObject[];
    driver?: string;
    prepare?: boolean;
}
export interface DimensionConfig {
    id: string;
    table: string;
    rule: GroupConfig;
    label?: string;
    meta?: IMetaInfo;
    sort?: "asc" | "desc" | sortHandler<anyData>;
}
export declare type FilterConfig = {
    [key: string]: FilterRule | string;
};
export declare type CalckConfig = {
    math: string;
    as: string;
};
export interface GroupConfig {
    by: string;
    as: string;
    sort?: "asc" | "desc";
}
export interface SortRule {
    by: string;
    dir: "asc" | "desc";
}
export declare type sortHandler<T> = {
    (a: T, b: T): number;
};
export declare type AggrFunction = {
    (arr: number[], arg1?: number[], arg2?: number[]): number;
};
export declare type MathFunction = {
    (arr: number, arg1?: number, arg2?: number): number;
};
export declare type AggrContext = {
    to: number;
    from: number;
    order: number[];
    array: {
        (i: number, c: AggrContext): number[];
    };
};
export declare type AggrHash = {
    [name: string]: AggrFunction | MathFunction;
};
export declare type AggrExecutor = (x: number, m: AggrHash, ctx: AggrContext) => number;
export declare type CommonDateGetter = {
    (table: ITable, key: string): DataGetter;
};
export declare type PivotContext = {
    getter: CommonDateGetter;
    math: AggrHash;
    compare: FiltersHash;
    limit: LimitConfig;
};
export declare type FilterFunc = {
    (v: anyData): boolean;
};
export declare type FilterBlock = {
    (v: filterData): FilterFunc;
};
export declare type FiltersHash = {
    [name: string]: FilterBlock;
};
