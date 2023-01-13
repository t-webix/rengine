import { anyObject, ITable, MetaField, TableConfig } from "./types";
export default class RawTable implements ITable {
    protected _columns: MetaField[];
    protected _raw: anyObject[];
    protected _prepared: boolean;
    constructor(config: TableConfig);
    parse(data: anyObject[]): void;
    prepare(): void;
    _parse_inner(): void;
    getColumn(id: string): MetaField;
    count(): number;
}
