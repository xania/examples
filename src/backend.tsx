import { JsxElement } from "../packages/view/lib/jsx/element";
import {
  TagTemplateNode,
  TextTemplateNode,
} from "../packages/view/lib/jsx/template-node";
import { CompileResult } from "../packages/view/lib/render/compile";
import { DomOperationType } from "../packages/view/lib/render/dom-operation";
import { serializeObject } from "./ssr";

export async function serverRender(page: any, write: (str: string) => void) {
  let hydrationKey = 0;
  const stack = [page];
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
        write(`import { List, Lazy, execute, RefMap } from "@xania/view";`);
        write(`const refs = new RefMap();`);
        write(`const domOperations = ${serializeObject(curr.contentOps)};`);
        write(`let node = document.body.querySelector('[data-hk="${hk}"]');`);
        write(`console.log(domOperations, [{}], node);`);

        write(`</script>`);
      } else {
        serializeNode(curr.templateNode);
      }
    } else {
      console.error("unknown", curr);
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
          write(`<script type="module">`);
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
      write(` class="${node.classList.join(" ")}"`);
    }

    if (hydrationKey) {
      write(` data-hk="${hydrationKey}"`);
    }
    for (const attrName in node.attrs) {
      write(` ${attrName}="${node.attrs[attrName]}"`);
    }

    if (node.childNodes.length) {
      write(" >");
      for (const child of node.childNodes) {
        if (child instanceof TagTemplateNode) serializeNode(child);
        else if (child instanceof TextTemplateNode) write(child.data);
      }
      write(`</${node.name}>`);
    } else {
      write(" />");
    }
  }
}
