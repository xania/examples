import type { IncomingMessage, OutgoingMessage } from 'http';
import { IActionResult } from './action-result';
import { isResumable } from '../resumable';

export class ViewResult implements IActionResult {
  constructor(public view: any) {}
  async execute(
    req: IncomingMessage,
    res: OutgoingMessage<IncomingMessage>,
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
      } else if (isResumable(curr)) {
        await curr.hibernate((s) => res.write(s));
      } else if (curr) {
        res.write('unknown ' + curr.toString());
      }
    }
    res.end();
  }
}
