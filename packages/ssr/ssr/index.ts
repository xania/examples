export class RefMap {
  map = new Map();
  resolve(ref: any, fn: Function, ...args: any[]) {
    if (this.map.has(ref)) {
      return this.map.get(ref);
    }
    const retval = fn.apply(null, args);
    this.map.set(ref, retval);
    return retval;
  }
}

export enum RehydrateType {
  Call = 475981,
}

export interface RehydrateCall {
  type: RehydrateType.Call;
  name: string;
  args: any[];
}

export type RehydrateOperation = RehydrateCall;

export function isRehydrateOperation(op: any): op is RehydrateOperation {
  return op && op.type === RehydrateType.Call;
}

export class Literal {
  constructor(public value: string) {}
}
