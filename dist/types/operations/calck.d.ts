import { fastOperation, ITable, AggrHash, groupOperation } from "../types";
export declare function optimize(table: ITable, order: number[], code: string, allMath: AggrHash): fastOperation;
export declare function optimizeGroup(code: string, allMath: AggrHash): groupOperation;
