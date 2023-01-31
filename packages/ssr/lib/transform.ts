import * as acorn from 'acorn';
import {
  ArrowFunctionExpression,
  BlockStatement,
  ClassDeclaration,
  Declaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
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
  | VariableDeclarator
  | ForStatement;

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

  const rootScope = new Scope();
  const scopes = [rootScope];

  const magicString = new MagicString(code);
  const exportIndex =
    ast.body.find((n) => n.type !== 'ImportDeclaration')?.start ?? 0;

  magicString.prependLeft(exportIndex, ';');

  function exportFunction(
    node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    args: string[]
  ) {
    const id = __id(code, node);

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

    return id;
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
      } else if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        const funcScope = Scope.fromFunction(node, scope);
        const references = getReferences(node);
        funcScope.references = references;
        scopes.push(funcScope);

        // for (const ref of references) {
        //   const alias = funcScope.getAlias(ref.name);
        //   if (alias !== false) {
        //     debugger;
        //   }
        // }

        if (node.type === 'FunctionDeclaration') {
          if (!scope.parent) {
            if (parent.type === 'ExportDefaultDeclaration') {
              const id = node.id?.name ?? __id(code, parent);
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
            const args = funcScope.getTrapped(references);
            const id = exportFunction(node, args);
            // create local reference

            magicString.appendRight(node.end, `const ${node.id!.name} = ${id}`);
            if (args.length > 0) {
              funcScope.aliases.set(node.id!.name, `${id}(${args.join(',')})`);
              magicString.appendRight(node.end, `(${args.join(',')})`);
            } else {
              funcScope.aliases.set(node.id!.name, `${id}`);
            }
          }
        } else if (
          node.type === 'FunctionExpression' ||
          node.type === 'ArrowFunctionExpression'
        ) {
          if (
            parent.type === 'Property' &&
            parent.method &&
            parent.kind === 'init'
          ) {
            if (node.async) {
              magicString.remove(parent.start, parent.key.start);
              magicString.prependRight(node.start, 'async function ');
            } else magicString.prependRight(node.start, 'function ');

            const args = funcScope.getTrapped(references);
            const id = exportFunction(node, args);

            // const [id, args] = exportFunction(node, funcScope);
            magicString.appendLeft(node.start, ':' + id);
            if (args.length > 0) {
              magicString.appendLeft(node.start, `(${args.join(',')})`);
            }
          } else if (scope.parent) {
            //       const funcNode = node as any as acorn.Node;
            const id = __id(code, node);
            const args = funcScope.getTrapped(references);

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
      }
    },
    leave(n, p) {
      const node = n as TypedNode;
      const parent = p as TypedNode;

      if (
        node.type === 'BlockStatement' ||
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        const scope = scopes.pop()!;

        if (node.type === 'FunctionDeclaration') {
          for (const [id, replacement] of scope.aliases) {
            let parent = scope.parent;
            while (parent) {
              if (parent.references)
                for (const ref of parent.references) {
                  if (ref.name === id) {
                    magicString.remove(ref.start, ref.end);
                    magicString.appendLeft(ref.start, replacement);
                  }
                }

              parent = parent.parent;
            }
          }
        }
      }
    },
  });

  if (opts.includeHelper === undefined || opts.includeHelper === true) {
    magicString.append(CLOSURE_HELPER);
  }

  return { code: magicString.toString(), map: magicString.generateMap() };
}

function __id(
  str: string,
  { id, start, end }: { id?: Identifier | null; start: number; end: number }
) {
  const baseName = id ? id.name.slice(0, 5) : '';
  const maxLen = 10 - baseName.length;
  const bits = new Int8Array({ length: maxLen }).fill(start);
  for (let i = 0, len = end - start + 1; i < len; i++) {
    const u = i % maxLen;
    const c = str.charCodeAt(i + start) ^ bits[u];

    bits[u] = (Math.abs(c - 97) % (122 - 97)) + 97;
  }

  const retval = String.fromCharCode(...bits);

  return baseName + retval;
}

function throwNever(message: string, type: never) {
  throw Error(message + type);
}

class Scope {
  public variables = new Set<string>();
  public references: Identifier[] | undefined;
  public aliases = new Map<string, string>();

  constructor(public parent?: Scope) {}

  static fromFunction(
    node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    parent?: Scope
  ) {
    const funcScope = this.fromParams(node.params, parent);
    if (node.body.type === 'BlockStatement') funcScope.init(node.body);
    return funcScope;
  }

  static fromParams(patterns: Pattern[], parent?: Scope) {
    const scope = new Scope(parent);
    const { variables } = scope;

    const stack: Pattern[] = patterns.slice(0);
    while (stack.length) {
      const pat = stack.pop()!;
      if (pat.type === 'Identifier') {
        variables.add(pat.name);
      } else if (pat.type === 'ArrayPattern') {
        for (const elt of pat.elements) {
          if (elt) {
            stack.push(elt);
          }
        }
      } else if (pat.type === 'AssignmentPattern') {
        stack.push(pat.left);
      } else if (pat.type === 'RestElement') {
        stack.push(pat.argument);
      } else {
        debugger;
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

        if (node.type === 'ForStatement') {
          this.skip();
        } else if (node.type === 'BlockStatement') {
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
          const stack: Pattern[] = [node.id];
          while (stack.length) {
            const pattern = stack.pop()!;

            if (pattern.type === 'Identifier') {
              variables.add(pattern.name!);
            } else if (pattern.type === 'ObjectPattern') {
              for (const p of pattern.properties) {
                if (p.type === 'Property') {
                  if (p.key.type === 'Identifier') {
                    variables.add(p.key.name);
                  } else {
                    debugger;
                  }
                } else if (p.type === 'RestElement') {
                  stack.push(p.argument);
                }
              }
            } else if (pattern.type === 'ArrayPattern') {
              for (const elt of pattern.elements) {
                if (elt) {
                  stack.push(elt);
                }
              }
            } else {
              debugger;
            }
          }
        }
      },
    });
  }

  getTrapped(references: Identifier[]) {
    const result: string[] = [];
    for (const id of references) {
      const name = id.name;
      if (this.isTrapped(name) && !result.includes(name)) result.push(name);
    }
    return result;
  }

  isTrapped(variable: string) {
    const { variables } = this;
    if (variables.has(variable)) {
      return false;
    }

    let parent: Scope | undefined = this.parent;
    while (parent) {
      if (parent.variables.has(variable)) return true;
      parent = parent.parent;
    }

    // unresolved variable.
    return false;
  }
}

function getReferences(
  funcDecl: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression
) {
  const result: Identifier[] = [];
  const skip = new Set();

  walk(funcDecl, {
    enter(n, p) {
      const node = n as TypedNode;
      const parent = p as TypedNode;

      if (skip.delete(node)) {
        this.skip();
      } else if (
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        for (const p of node.params) skip.add(p);
      } else if (node.type === 'FunctionDeclaration') {
        skip.add(node.id);
        for (const p of node.params) skip.add(p);
      } else if (node.type === 'MemberExpression') {
        skip.add(node.property);
        // } else if (node.type === 'CallExpression') {
        //   skip.add(node.callee);
      } else if (node.type === 'Property') {
        if (node.method) {
          this.skip();
        } else {
          skip.add(node.key);
        }
      } else if (node.type === 'Identifier') {
        result.push(node);
      }
    },
  });

  return result;
}
