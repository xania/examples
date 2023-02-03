import * as http from 'node:http';

export type IActionHandler = () => IActionResult;

export interface IActionResult {
  execute(
    req: http.IncomingMessage,
    res: http.OutgoingMessage,
    next: Function
  ): Promise<void> | void;
}

export class Literal {
  constructor(public value: string) {}
}

export class Call {
  constructor(public func: Function, public args: any[]) {}
}
