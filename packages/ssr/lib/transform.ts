import * as acorn from 'acorn';
import {
  BlockStatement,
  ClassDeclaration,
  Declaration,
  Directive,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  ModuleDeclaration,
  Pattern,
  Program,
  Property,
  SpreadElement,
  Statement,
} from 'estree';
import MagicString from 'magic-string';
import { walk } from 'estree-walker';

declare module 'estree' {
  export interface BaseNode {
    start: number;
    end: number;
  }
}

export const CLOSURE_HELPER = `;function __closure(name, fn, args) { return Object.assign(fn, {__src: import.meta.url, __name: name, __args: args}) }`;

type TypedNode =
  | Declaration
  | BlockStatement
  | Expression
  | SpreadElement
  | Property
  | Pattern
  | ExportNamedDeclaration
  | ExportDefaultDeclaration
  | ClassDeclaration;

export type TransfromOptions = {
  entry: string;
  includeHelper?: boolean;
};

export function transform(
  code: string,
  opts: TransfromOptions
): { code: string; map: any } | undefined {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
  }) as Program;

  const rootScope = Scope.fromBody(ast.body);
  const scopes = [rootScope];
  const stack: (readonly [Scope, TypedNode, boolean])[] = [];
  // let entryDeclaration: acorn.Node | undefined = undefined;

  const magicString = new MagicString(code);
  function content(node: { start: number; end: number }) {
    return magicString.slice(node.start, node.end);
  }

  function exportFunction(
    node: FunctionDeclaration | FunctionExpression,
    scope: Scope
  ) {
    const id = __id(content(node));
    const args = getTrappedReferences(node, scope);

    if (args.length > 0) {
      // magicString.appendLeft(node.start, `(${args.join(',')})`);
      magicString.appendLeft(node.end, `, [${args.join(',')}]`);

      magicString.prependRight(node.start, `(${args.join(',')}) => `);
    }

    magicString.prependRight(
      node.start,
      `;export const ${id} = __closure("${id}", `
    );
    magicString.appendLeft(node.end, `)`);

    magicString.move(node.start, node.end, ast.end);

    return [id, args] as const;
  }

  walk(ast, {
    enter(n, p) {
      const node = n as TypedNode;
      const parent = p as TypedNode;
      let scope = scopes[scopes.length - 1]!;

      if (node.type === 'ClassDeclaration') {
        this.skip();
      } else if (node.type === 'BlockStatement') {
        const blockScope = Scope.fromBody(node.body, scope);
        scopes.push(blockScope);
      } else if (node.type === 'FunctionDeclaration') {
        const funcScope = Scope.fromParams(node.params, scope);
        scopes.push(funcScope);

        if (!scope.parent) {
          if (parent.type === 'ExportDefaultDeclaration') {
            // const [id, args] = exportFunction(node, scope);
            // magicString.appendLeft(node.start, `${id}`);
            // magicString.remove(parent.start, node.start);
            const id = node.id?.name ?? __id(content(parent));
            magicString.appendRight(
              node.start,
              `const ${id} = __closure("${id}", `
            );
            magicString.appendRight(parent.start, `);`);
            magicString.appendRight(parent.end, ` ${id};`);

            magicString.move(node.start, node.end, parent.start);
          } else {
            const funName = node.id?.name ?? 'default';

            if (parent.type !== 'ExportNamedDeclaration') {
              magicString.appendRight(node.start, `export `);
            }

            magicString.appendLeft(
              node.end,
              `;__closure("${funName}", ${funName})`
            );
          }
        } else {
          const [id, args] = exportFunction(node, funcScope);
          // create local reference

          magicString.appendRight(node.end, `;const ${node.id!.name} = ${id}`);
          if (args.length > 0) {
            magicString.appendRight(node.end, `(${args.join(',')})`);
          }
          //       magicString.appendLeft(funcNode.start, `${id}(${args})`);
          //       magicString.prependRight(
          //         funcNode.start,
          //         `;export const ${id} = (${args}) => __closure("${id}", `
          //       );
          //       magicString.appendLeft(
          //         funcNode.end,
          //         args.length ? ', [' + args + '])' : ')'
          //       );
          //      magicString.move(node.start, funcNode.end, entryDeclaration!.end);
          //       break;
        }
      } else if (node.type === 'FunctionExpression') {
        // if (!scope.parent) {
        //   const funName = node.id?.name ?? 'default';

        //   magicString.appendLeft(
        //     node.end,
        //     `;__closure("${funName}", ${funName})`
        //   );
        // }

        const funcScope = Scope.fromParams(node.params, scope);
        scopes.push(funcScope);

        if (
          parent.type === 'Property' &&
          parent.method &&
          parent.kind === 'init'
        ) {
          if (node.async) {
            magicString.remove(parent.start, parent.key.start);
            magicString.prependRight(node.start, 'async function ');
          } else magicString.prependRight(node.start, 'function ');
          const [id, args] = exportFunction(node, funcScope);
          magicString.appendLeft(node.start, ':' + id);
          if (args.length > 0) {
            magicString.appendLeft(node.start, `(${args.join(',')})`);
          }
        } else if (scope.parent) {
          //       const funcNode = node as any as acorn.Node;
          const id = __id(content(node));
          const args = getTrappedReferences(node, funcScope);

          // create local reference
          magicString.appendLeft(node.start, `${id}`);
          magicString.appendRight(node.start, `const ${id} = `);

          if (args.length > 0) {
            magicString.appendLeft(node.start, `(${args.join(',')})`);
            magicString.appendRight(node.start, `(${args.join(',')}) => `);
            magicString.appendLeft(node.end, `, [${args.join(',')}]`);
          }

          // export definition
          magicString.appendRight(node.start, `__closure("${id}", `);
          magicString.appendLeft(node.end, `)`);

          magicString.move(node.start, node.end, ast.end);
          //       magicString.appendLeft(funcNode.start, `${id}(${args})`);
          //       magicString.prependRight(
          //         funcNode.start,
          //         `;export const ${id} = (${args}) => __closure("${id}", `
          //       );
          //       magicString.appendLeft(
          //         funcNode.end,
          //         args.length ? ', [' + args + '])' : ')'
          //       );
          //      magicString.move(node.start, funcNode.end, entryDeclaration!.end);
          //       break;
        }
      }
    },
    leave(n, p) {
      const node = n as TypedNode;
      const parent = p as TypedNode;

      if (
        node.type === 'BlockStatement' ||
        node.type === 'FunctionDeclaration'
      ) {
        scopes.pop();
      }
    },
  });

  if (opts.includeHelper === undefined || opts.includeHelper === true) {
    magicString.append(CLOSURE_HELPER);
  }

  // for (const item of ast.body) {
  //   if (item.type === 'ExportNamedDeclaration') {
  //     const { declaration } = item;
  //     if (declaration) {
  //       if (declaration.type === 'FunctionDeclaration') {
  //         // if (id?.name === opts.entry) {
  //         // entryDeclaration = item as any as acorn.Node;

  //         if (declaration.params.length > 0) {
  //           const declScope = Scope.fromParams(declaration.params, rootScope);
  //           stack.push([declScope, declaration.body]);
  //         } else {
  //           stack.push([rootScope, declaration.body]);
  //         }
  //         // }
  //       }
  //     }
  //   }
  // }

  // // if (!entryDeclaration) {
  // //   return;
  // // }

  // function content(node: acorn.Node) {
  //   return magicString.slice(node.start, node.end);
  // }

  // while (stack.length) {
  //   const [scope, node] = stack.pop()!;
  //   switch (node.type) {
  //     case 'BlockStatement':
  //       const blockBody = node.body;
  //       for (const stmt of blockBody) {
  //         if (stmt.type === 'ReturnStatement') {
  //           const { argument } = stmt;
  //           if (argument) {
  //             const newScope = Scope.fromBody(blockBody, scope);
  //             stack.push([newScope, argument]);
  //             // stack.push([newScope, argument]);
  //           }
  //         }
  //       }
  //       break;
  //     case 'FunctionDeclaration':
  //       const funName = node.id?.name ?? 'default';
  //       magicString.appendLeft(
  //         node.end,
  //         `;${funName}.__src = import.meta.url + "#${funName}"`
  //       );

  //       {
  //         let funArgs = getTrappedReferences(node.body, scope);
  //       }
  //       break;
  //     case 'ArrowFunctionExpression':
  //     case 'FunctionExpression':
  //       const funcNode = node as any as acorn.Node;
  //       const id = __id(content(funcNode));

  //       let args = getTrappedReferences(node.body, scope);

  //       magicString.appendLeft(funcNode.start, `${id}(${args})`);
  //       magicString.prependRight(
  //         funcNode.start,
  //         `;export const ${id} = (${args}) => __closure("${id}", `
  //       );
  //       magicString.appendLeft(
  //         funcNode.end,
  //         args.length ? ', [' + args + '])' : ')'
  //       );
  //       magicString.move(funcNode.start, funcNode.end, entryDeclaration!.end);
  //       break;
  //     case 'Property':
  //       if (node.method) {
  //         if (node.value.type === 'FunctionExpression') {
  //           const funcNode = node.value as any as acorn.Node;

  //           magicString.appendLeft(funcNode.start, ':');
  //           magicString.appendRight(funcNode.start, 'function ');

  //           stack.push([scope, node.value]);

  //           // const id = __id(content(funcNode));

  //           // let args = getTrappedReferences(node.value.body, scope);

  //           // magicString.appendLeft(funcNode.start, `: ${id}(${args})`);
  //           // magicString.appendRight(
  //           //   funcNode.start,
  //           //   `;export const ${id} = (${args}) => __closure("${id}", function`
  //           // );
  //           // magicString.appendLeft(
  //           //   funcNode.end,
  //           //   args.length ? ', [' + args + '])' : ')'
  //           // );
  //           // magicString.move(funcNode.start, funcNode.end, endIndex);
  //         }
  //       } else {
  //         stack.push([scope, node.value]);
  //       }
  //       break;
  //     case 'VariableDeclaration':
  //     case 'ClassDeclaration':
  //       break;
  //     case 'SpreadElement':
  //       stack.push([scope, node.argument]);
  //       break;
  //     case 'ArrayExpression':
  //       for (let i = node.elements.length - 1; i >= 0; i--) {
  //         const elt = node.elements[i];
  //         if (elt) {
  //           stack.push([scope, elt]);
  //         }
  //       }
  //       break;
  //     case 'ObjectExpression':
  //       const { properties } = node;
  //       for (let i = properties.length - 1; i >= 0; i--) {
  //         stack.push([scope, properties[i]]);
  //       }
  //       break;
  //     case 'Identifier':
  //       const resolved = scope.resolve(node.name);
  //       if (resolved) {
  //         const [valueScope, valueExpr] = resolved;
  //         const valueNode = valueExpr as any as acorn.Node;
  //       }

  //       // if (resolved) stack.push(resolved);
  //       break;
  //     default:
  //       console.log(node.type);
  //   }
  // }

  return { code: magicString.toString(), map: magicString.generateMap() };
}

function __id(str: string) {
  const maxLen = 10;
  let bits = new Int8Array({ length: maxLen }).fill('_'.charCodeAt(0));
  for (let i = 0; i < str.length; i++) {
    const u = i % maxLen;
    const c = str.charCodeAt(i) ^ bits[u];

    bits[u] = (Math.abs(c - 97) % (122 - 97)) + 97;
  }

  return String.fromCharCode(...bits);
}

function throwNever(message: string, type: never) {
  throw Error(message + type);
}

class Scope {
  public variables = new Set<string>();
  constructor(public parent?: Scope) {}

  static fromParams(patterns: Pattern[], parent?: Scope) {
    const scope = new Scope(parent);
    const { variables } = scope;

    for (let i = 0, len = patterns.length; i < len; i++) {
      const pat = patterns[0];
      if (pat.type === 'Identifier') {
        variables.add(pat.name);
      }
    }

    return scope;
  }

  static fromBody(
    root: (Statement | Directive | ModuleDeclaration)[],
    parent?: Scope
  ) {
    const scope = new Scope(parent);
    scope.init(root);
    return scope;
  }

  init(root: (Statement | Directive | ModuleDeclaration)[]) {
    const { variables } = this;

    const stack = root.slice(0);
    while (stack.length) {
      const item = stack.pop()!;
      if (item.type === 'ExportNamedDeclaration') {
        if (item.declaration) {
          stack.push(item.declaration);
        }
      } else if (item.type === 'FunctionDeclaration') {
        const funName = item.id?.name;
        if (funName) {
          variables.add(funName);
        }
      } else if (item.type === 'VariableDeclaration') {
        for (const varDeclarator of item.declarations) {
          const pattern = varDeclarator.id;
          if (pattern.type === 'Identifier') {
            variables.add(pattern.name!);
          }
        }
      }
    }
  }

  isTrapped(variable: string) {
    const { variables } = this;
    if (variables.has(variable)) {
      return false;
    }

    let parent = this.parent;
    while (parent) {
      if (parent.variables.has(variable)) return true;
      parent = parent.parent;
    }

    // unresolved variable.
    return false;
  }
}

function getTrappedReferences(
  funcDecl: FunctionDeclaration | FunctionExpression,
  funcScope: Scope
) {
  const funcBody = funcDecl.body;
  const stack: (Expression | Statement | SpreadElement)[] = [];
  // const funcScope: Scope = new Scope(scope);
  if (funcBody.type === 'BlockStatement') {
    funcScope.init(funcBody.body);
    for (let i = funcBody.body.length - 1; i >= 0; i--) {
      stack.push(funcBody.body[i]);
    }
  } else {
    stack.push(funcBody);
  }

  const result: string[] = [];

  while (stack.length) {
    const curr = stack.pop()!;

    switch (curr.type) {
      case 'SpreadElement':
        stack.push(curr.argument);
        break;
      case 'CallExpression':
        const args = curr.arguments;
        for (let i = args.length - 1; i >= 0; i--) {
          stack.push(args[i]);
        }
        break;
      case 'ReturnStatement':
        const { argument } = curr;
        if (argument) {
          stack.push(argument);
        }
        break;
      case 'BinaryExpression':
        stack.push(curr.left);
        stack.push(curr.right);
        break;
      case 'Identifier':
        if (funcScope.isTrapped(curr.name)) result.push(curr.name);
        break;
      case 'VariableDeclaration':
        for (const varDeclarator of curr.declarations) {
          const pattern = varDeclarator.id;
          if (pattern.type === 'Identifier') {
            funcScope.variables.add(pattern.name);
          }
        }
        break;
    }
  }

  return result;
}
