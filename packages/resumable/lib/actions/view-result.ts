import type { IncomingMessage, OutgoingMessage } from 'http';
import { IActionResult } from './action-result';
import { isResumable } from '../resumable';
import { RefMap, hibernateObject, ImportMap } from '../hibernate';
import path from 'node:path';

export class ViewResult implements IActionResult {
  constructor(public view: any) {}
  async execute(root: string, res: OutgoingMessage<IncomingMessage>) {
    const refMap = new RefMap();

    await write(this.view);

    function hydrate(obj: any) {
      const ref = refMap.getRef(obj);
      if (ref)
        res.write(
          `(__cache[${ref}] ?? (__cache[${ref}] = __hydrate(__refs[${ref}], hydrationRoot)))`
        );
      else throw Error('write obj before calling hydrate');
    }

    function resumableUrl(source: string) {
      const relative = source.startsWith('/')
        ? source
        : '/' + path.relative(root, source).replaceAll('\\', '/');

      return '/@resumable' + relative;
    }

    function hibernate(obj: any) {
      const importMap = new ImportMap();
      res.write(hibernateObject(obj, refMap, importMap));
      res.write(`;`);
      for (const [loader, source] of importMap.entries) {
        res.write(
          `\nfunction ${loader}(){ return import("${resumableUrl(source)}") }`
        );
      }
    }

    async function write(root: any) {
      const stack = [root];
      while (stack.length) {
        const curr = stack.pop();
        if (curr instanceof Promise) {
          stack.push(await curr);
        } else if (curr instanceof Array) {
          for (let i = curr.length - 1; i >= 0; i--) {
            stack.push(curr[i]);
          }
        } else if (isResumable(curr)) {
          await curr.hibernate({ write, hydrate, hibernate, resumableUrl });
        } else if (curr) {
          res.write(curr.toString());
        }
      }
    }

    res.end();
  }
}
