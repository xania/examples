import {
  DomOperationType,
  JsxElement,
  TagTemplateNode,
  TemplateNodeType,
} from '@xania/view';
import { CompileResult } from '../../view/lib/render/compile';
import { serializeObject } from '../lib/ssr';

export class ViewResult {
  constructor(public page: any) {}

  async execute(write: (str: string) => void) {
    let hydrationKey = 0;
    const stack = [this.page];
    while (stack.length) {
      const curr = stack.pop();
      if (curr instanceof Promise) {
        stack.push(await curr);
      } else if (curr instanceof Array) {
        for (const item of curr) {
          stack.push(item);
        }
      } else if (curr instanceof JsxElement) {
        if (curr.contentOps.length) {
          const hk = ++hydrationKey;
          serializeNode(curr.templateNode, hk.toString());
          write(`<script type="module">`);
          write(
            `import { List, If, Lazy, execute, JsxElement, ListSource  } from "@xania/view";`
          );
          write(`const domOperations = ${serializeObject(curr.contentOps)};`);
          write(`const node = document.querySelector('[data-hk="${hk}"]');`);
          write(`execute(domOperations, [{}], node);`);

          write(`</script>`);
        } else {
          serializeNode(curr.templateNode);
        }
      } else {
        console.error('unknown', curr);
      }
    }

    function serializeCompileResult(cr: CompileResult<any>) {
      let inScripBlock = false;

      for (const op of cr.renderOperations) {
        if (op.type === DomOperationType.Clone) {
          if (inScripBlock) {
            write(`</script>`);
            inScripBlock = false;
          }
          const hk = ++hydrationKey;
          serializeNode(op.templateNode, hk.toString());
        } else {
          if (!inScripBlock) {
            write(`<script type="ssr">`);
            inScripBlock = true;
          }
          switch (op.type) {
            default:
              write(`console.log("${DomOperationType[op.type]}");`);
              break;
          }
        }
      }
      if (inScripBlock) {
        write(`</script>`);
      }
    }

    function serializeNode(node: TagTemplateNode, hydrationKey?: string) {
      write(`<${node.name}`);
      if (node.classList.length) {
        write(` class="${node.classList.join(' ')}"`);
      }

      if (hydrationKey) {
        write(` data-hk="${hydrationKey}"`);
      }
      for (const attrName in node.attrs) {
        write(` ${attrName}="${node.attrs[attrName]}"`);
      }

      if (node.childNodes.length) {
        write(' >');
        for (const child of node.childNodes) {
          switch (child.type) {
            case TemplateNodeType.Tag:
              serializeNode(child);
              break;
            case TemplateNodeType.Text:
              write(child.data);
              break;
            case TemplateNodeType.Anchor:
              write(`<!--${child.label}-->`);
              break;
          }
        }
        write(`</${node.name}>`);
      } else {
        write(' />');
      }
    }
  }
}
