import * as http from 'node:http';

export type IActionHandler = () => IActionResult;

export interface IActionResult {
  execute(root: string, res: http.OutgoingMessage): Promise<void> | void;
}

export class Literal {
  constructor(public value: string) {}
}

export class Call {
  constructor(public func: Function, public args: any[]) {}
}
