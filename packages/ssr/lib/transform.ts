import * as acorn from 'acorn';
import {
  ArrowFunctionExpression,
  BlockStatement,
  ClassDeclaration,
  Declaration,
  Directive,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  FunctionDeclaration,
  FunctionExpression,
  ImportDeclaration,
  ModuleDeclaration,
  Pattern,
  Program,
  Property,
  SpreadElement,
  Statement,
  VariableDeclarator,
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
  | ClassDeclaration
  | ImportDeclaration
  | VariableDeclarator;

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

  const rootScope = Scope.fromBody(ast);
  const scopes = [rootScope];
  const stack: (readonly [Scope, TypedNode, boolean])[] = [];
  // let entryDeclaration: acorn.Node | undefined = undefined;

  const magicString = new MagicString(code);
  function content(node: { start: number; end: number }) {
    return magicString.slice(node.start, node.end);
  }

  const exportIndex =
    ast.body.find((n) => n.type !== 'ImportDeclaration')?.start ?? 0;

  magicString.prependLeft(exportIndex, ';');

  function exportFunction(
    node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    scope: Scope
  ) {
    const id = __id(content(node));
    const args = getTrappedReferences(node, scope);

    if (args.length > 0) {
      // magicString.appendLeft(node.start, `(${args.join(',')})`);
      magicString.appendLeft(node.end, `, [${args.join(',')}]`);
      magicString.prependRight(
        node.start,
        `;export const ${id} = (${args.join(',')}) => __closure("${id}", `
      );
    } else {
      magicString.prependRight(
        node.start,
        `;export const ${id} = __closure("${id}", `
      );
    }

    magicString.appendLeft(node.end, `);`);

    magicString.move(node.start, node.end, exportIndex);

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
        const blockScope = Scope.fromBody(node, scope);
        scopes.push(blockScope);
      } else if (node.type === 'FunctionDeclaration') {
        if (node.id?.name === 'listen') debugger;

        const funcScope = Scope.fromParams(node.params, scope);
        scopes.push(funcScope);

        if (!scope.parent) {
          if (parent.type === 'ExportDefaultDeclaration') {
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
              `;__closure("${funName}", ${funName});`
            );
          }
        } else {
          const [id, args] = exportFunction(node, funcScope);
          // create local reference

          magicString.appendRight(node.end, `const ${node.id!.name} = ${id}`);
          if (args.length > 0) {
            magicString.appendRight(node.end, `(${args.join(',')})`);
          }
        }
      } else if (
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
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
          magicString.appendLeft(node.end, `);`);

          magicString.move(node.start, node.end, exportIndex);
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

  const retval = String.fromCharCode(...bits);
  return retval;
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
      const pat = patterns[i];
      if (pat.type === 'Identifier') {
        variables.add(pat.name);
      }
    }

    return scope;
  }

  static fromBody(root: BlockStatement | Program, parent?: Scope) {
    const scope = new Scope(parent);
    scope.init(root);
    return scope;
  }

  init(root: BlockStatement | Program) {
    const { variables } = this;

    walk(root, {
      enter(n, p) {
        const node = n as TypedNode;
        const parent = p as TypedNode;

        if (node.type === 'BlockStatement') {
          if (node !== root) {
            this.skip();
          }
        } else if (node.type === 'FunctionDeclaration') {
          const funName = node.id?.name;
          if (funName) {
            variables.add(funName);
          }

          this.skip();
        } else if (node.type === 'VariableDeclarator') {
          const pattern = node.id;
          if (pattern.type === 'Identifier') {
            variables.add(pattern.name!);
          }
        }
      },
    });
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
  funcDecl: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
  scope: Scope
) {
  const funcBody = funcDecl.body;
  const stack: (Expression | Statement | SpreadElement)[] = [];
  const funcScope: Scope = new Scope();
  if (funcBody.type === 'BlockStatement') {
    funcScope.init(funcBody);
    for (let i = funcBody.body.length - 1; i >= 0; i--) {
      stack.push(funcBody.body[i]);
    }
  } else {
    stack.push(funcBody);
  }

  const result: string[] = [];

  const skip = new Set();

  walk(funcBody, {
    enter(n, p) {
      const node = n as TypedNode;
      const parent = p as TypedNode;

      if (skip.delete(node)) {
        this.skip();
      } else if (node.type === 'MemberExpression') {
        skip.add(node.property);
      } else if (node.type === 'CallExpression') {
        skip.add(node.callee);
      } else if (node.type === 'Property') {
        this.skip();
      } else if (node.type === 'Identifier') {
        if (node.name === 'handler') {
          debugger;
        }

        if (
          !funcScope.variables.has(node.name) &&
          !result.includes(node.name) &&
          scope.isTrapped(node.name)
        ) {
          result.push(node.name);
        }
      }
    },
  });

  return result;
}
