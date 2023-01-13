import { anyObject, ITable } from "./types";
import RawTable from "./RawTable";
export default class ColumnTable extends RawTable implements ITable {
    parse(data: anyObject[]): void;
    _parse_init(n: number): void;
    count(): number;
}
