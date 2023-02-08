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
        for (let i = curr.length - 1; i >= 0; i--) {
          stack.push(curr[i]);
        }
      } else if (curr instanceof Function) {
      } else if (isResumable(curr)) {
        await curr.hibernate(res);
      } else if (curr) {
        res.write(curr.toString());
      }
    }
    res.write(`
    <script>
      async function __hydrate(obj, hydrationRoot) {
        const result = {};

        const stack = [[result, 'root', obj]];
        while(stack.length) {
          const [t, p, src] = stack.pop();
          if (src === null || src === undefined) {
            t[p] = src;
          } else if (typeof src === 'object') {
            if (src instanceof Array) {
              const c = [];
              t[p] = c;
              for(const k in src) {
                stack.push([c, k, src[k]])
              }
            } else if ('__ctor' in src) {
              const ctor = src.__ctor;
              const instance = await import(ctor.__src).then(mod => new mod[ctor.__name]);
              t[p] = instance;
              for(const k in src) {
                stack.push([instance, k, src[k]])
              }
            } else if ('__src' in src) {
              t[p] = await import(src.__src).then(m => m[src.__name])
            } else if ('__node' in src) {
              const path = src.__node;
              let node = hydrationRoot;
              for(let i=0, len = path.length ; i<len ; i++) {
                node = node.childNodes[path[i]];
              }
              t[p] = node;
            } else {
              const c = {};
              t[p] = c;
              for(const k in src) {
                stack.push([c, k, src[k]])
              }
            }
          } else {
            t[p] = src;
          }
        }
        return result.root;
      }
    </script>
    `);
    res.end();
  }
}
