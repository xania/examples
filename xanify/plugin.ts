import type { Plugin } from "vite";
import { walk } from "estree-walker";
import { CallExpression, Identifier, MemberExpression } from "estree";

const types = new Set<string>();
function registerType(type: string) {
  if (!types.add(type)) {
    console.log(type);
  }
}

export default function (): Plugin {
  return {
    name: "xanify",
    transform(code, id, options) {
      if (id.endsWith(".page") && options.ssr == true) {
        console.log(id, options);

        const ast = this.parse(code);
        walk(ast, {
          enter(node: any, parent, prop, index) {
            // some code happens
            if (node.type === "ExportNamedDeclaration") {
              console.log(id, node?.declaration?.id?.name);
            }
            // if (node.type === "CallExpression") {
            //   const call = node as CallExpression;
            //   const callee = call.callee as MemberExpression;
            //   const object = callee?.object as Identifier;
            //   if (object?.name === "jsx") {
            //     console.log(node);
            //   }
            // }
          },
          leave(node, parent, prop, index) {
            // some code happens
          },
        });

        return { ast };
      }
      return undefined;
    },
  } as Plugin;
}

// import { createFilter } from "@rollup/pluginutils";

// export default function transformCodePlugin(options: any = {}) {
//   const filter = createFilter(options.include, options.exclude);

//   return {
//     name: "xanify-jsx",
//     transform(code, id) {
//       if (!filter(id)) return;

//       console.log(code);
//       // proceed with the transformation...
//       return {
//         code: code,
//         map: null,
//       };
//     },
//     load() {},
//   };
// }
