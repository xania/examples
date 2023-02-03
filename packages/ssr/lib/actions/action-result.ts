import * as http from 'node:http';

export type IActionHandler = () => IActionResult;

interface IActionResult {
  execute(
    req: http.IncomingMessage,
    res: http.OutgoingMessage,
    next: Function
  ): Promise<void>;
}

export class ViewResult implements IActionResult {
  constructor(public view: any) {}
  async execute(
    req: http.IncomingMessage,
    res: http.OutgoingMessage<http.IncomingMessage>,
    next: Function
  ) {
    const { view } = this;

    const stack = [view];
    while (stack.length) {
      const curr = stack.pop();
      if (curr instanceof Promise) {
        stack.push(await curr);
      } else if (curr instanceof Array) {
        for (const item of curr) {
          stack.push(item);
        }
      } else if (curr instanceof Function) {
      } else if (isHibernatable(curr)) {
        await curr.hibernate((s) => res.write(s));
      } else if (curr) {
        res.write('unknown ' + curr.toString());
      }
    }
    res.end();
  }
}

interface Hibernatable {
  hibernate(write: (s: string) => void): string;
}

function isHibernatable(obj: any): obj is Hibernatable {
  return obj && obj.hibernate instanceof Function;
}

export class Literal {
  constructor(public value: string) {}
}

export class Call {
  constructor(public func: Function, public args: any[]) {}
}
