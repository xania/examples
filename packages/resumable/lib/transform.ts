import * as acorn from 'acorn';
import {
  ArrowFunctionExpression,
  BlockStatement,
  ClassDeclaration,
  ClassExpression,
  Declaration,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  MethodDefinition,
  Pattern,
  PrivateIdentifier,
  Program,
  Property,
  PropertyDefinition,
  SpreadElement,
  ThisExpression,
  VariableDeclarator,
  WhileStatement,
} from 'estree';
import MagicString from 'magic-string';
import { walk } from 'estree-walker';
import { variableFromPatterns } from './transform/ast/var-from-patterns';
declare module 'estree' {
  export interface BaseNode {
    start: number;
    end: number;
  }
}

const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
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
  | ForStatement
  | Program
  | MethodDefinition
  | PropertyDefinition
  | WhileStatement
  | ThisExpression
  | PrivateIdentifier
  | ExportAllDeclaration;

export type TransfromOptions = {
  // entry: string[];
  // ssr?: boolean;
  includeHelper?: boolean;
};

function transform(
  code: string,
  opts: TransfromOptions
): { code: string; map: any; closures: Closure[] } | undefined {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
  }) as Program;

  const rootScope = new Scope(0, ast, false);
  const scopes = [rootScope];
  const magicString = new MagicString(code);

  let rootStart = 0;

  // magicString.prependLeft(exportIndex, ';');

  const skipEnter = new Map<TypedNode, 'deep' | 'shallow'>();

  walk(ast, {
    enter(n, p) {
      const node = n as TypedNode;
      const parent = (p || ast) as TypedNode;
      let scope = scopes[scopes.length - 1]!;

      if (p === ast) {
        rootStart = node.start;
      }

      // if (
      //   parent.type === 'ExportNamedDeclaration' ||
      //   parent.type === 'ExportDefaultDeclaration'
      // ) {
      //   scope.dependents.push([node, parent]);
      // }

      if (skipEnter.has(node)) {
        const mode = skipEnter.get(node);
        skipEnter.delete(node);
        if (mode === 'deep') {
          this.skip();
        }
        return;
      } else if (
        node.type === 'ImportDeclaration' ||
        node.type === 'ExportAllDeclaration'
      ) {
        if (CSS_LANGS_RE.test(node.source.value as string)) {
          // magicString.remove(node.start, node.end);
          this.skip();
        } else {
          const source = node.source.raw;
          if (source) {
            const match = source.match(/\.[jt]sx?/);
            if (match) {
              magicString.appendRight(node.source.start + 1, '/@resumable');
            } else {
              console.error(source);
            }
          }
        }
      } else if (
        node.type === 'ClassDeclaration' ||
        node.type === 'ClassExpression'
      ) {
        const classScope = new Scope(rootStart, node, true, scope);
        scopes.push(classScope);

        if (node.id) {
          scope.unused.add(node);

          skipEnter.set(node.id, 'deep');
          const alias = __alias(code, node, scope.rootStart);
          scope.closures.set(node.id.name, [alias, parent, classScope]);
        }
      } else if (
        node.type === 'MethodDefinition' ||
        node.type === 'PropertyDefinition' ||
        node.type === 'Property'
      ) {
        skipEnter.set(node.key, 'deep');

        if (node.type === 'MethodDefinition' && node.kind === 'constructor')
          skipEnter.set(node.value, 'shallow');

        const memberScope = new Scope(rootStart, node, true, scope);
        scopes.push(memberScope);
      } else if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        if (node.type === 'FunctionDeclaration') {
          scope.unused.add(node);
        }

        const funcScope = new Scope(
          rootStart,
          node,
          node.type !== 'ArrowFunctionExpression',
          scope
        );
        for (const [v, n] of variableFromPatterns(node.params)) {
          funcScope.declarations.set(v, v);
        }
        scopes.push(funcScope);

        for (const p of node.params) skipEnter.set(p, 'deep');
        if (
          node.type === 'FunctionDeclaration' ||
          (node.type === 'FunctionExpression' && node.id)
        ) {
          skipEnter.set(node.id!, 'deep');
          const funName = node.id?.name;

          if (funName) {
            const alias = __alias(code, node, rootStart);
            scope.closures.set(funName, [alias, parent, funcScope]);
          }
        }
      } else if (node.type === 'MemberExpression') {
        skipEnter.set(node.property!, 'deep');
      } else if (
        node.type === 'ForStatement' ||
        node.type === 'WhileStatement'
      ) {
        scopes.push(new Scope(rootStart, node, false, scope));
      } else if (node.type === 'VariableDeclaration') {
        for (const declarator of node.declarations) {
          skipEnter.set(declarator.id, 'deep');
          for (const [v, n] of variableFromPatterns([declarator.id])) {
            scope.declarations.set(v, v);
          }
        }
      } else if (node.type === 'Identifier') {
        scope.references.push(new Reference(node, scope));
      } else if (node.type === 'ThisExpression') {
        scope.references.push(node);
      }
    },
    leave(n, p) {
      const node = n as TypedNode;
      const parent = (p || ast) as TypedNode;
      let scope = scopes[scopes.length - 1]!;

      const isRoot =
        !parent ||
        parent.type === 'ExportDefaultDeclaration' ||
        parent.type === 'Program' ||
        parent.type === 'ExportNamedDeclaration';

      function popScope() {
        if (!scope.parent) return;
        const blockScope = scopes.pop()!;
        const [references, unused] = blockScope.close();
        const parentScope = blockScope.parent!;

        for (const ref of references) {
          parentScope.references.push(ref);
        }

        for (const u of unused) {
          parentScope.unused.add(u);
        }
      }

      // if (
      //   node.type === 'FunctionDeclaration' ||
      //   node.type === 'ClassDeclaration'
      // ) {
      //   const alias = __alias(code, node, scope.rootStart);

      //   if (isRoot) {
      //     const id =
      //       parent.type === 'ExportDefaultDeclaration'
      //         ? node.id?.name ?? alias
      //         : node.id!.name;
      //     scope.parent!.tasks.push({
      //       type: TransformTaskType.ExportFuncDeclaration,
      //       scope,
      //       isRoot,
      //       parent,
      //       node,
      //       alias,
      //       params: [],
      //       id,
      //     });
      //   } else {
      //     // const [_, args] = scope.paramsAndArgs();
      //     // const args: string[] = uniqueParams(scope.trappedReferences());
      //     //   const args = funcScope.getTrapped(references);

      //     // scope.parent!.aliases.set(node.id!.name, {
      //     //   content: args.length ? `${alias}(${args.join(',')})` : alias,
      //     // });

      //     scope.parent!.tasks.push({
      //       type: TransformTaskType.ExportFuncDeclaration,
      //       scope,
      //       alias: alias,
      //       isRoot: false,
      //       node,
      //       parent,
      //       id: node.id!.name,
      //       params: [],
      //     });
      //   }
      // } else if (
      //   node.type === 'FunctionExpression' ||
      //   node.type === 'ArrowFunctionExpression' ||
      //   node.type === 'ClassExpression'
      // ) {
      //   const alias = __alias(code, node, scope.rootStart);

      //   if (parent.type !== 'MethodDefinition' || parent.kind === 'method') {
      //     scope.parent!.tasks.push({
      //       type: TransformTaskType.ExportFuncExpression,
      //       parent,
      //       node,
      //       isRoot,
      //       scope,
      //       alias,
      //       params: [],
      //     });
      //   }
      // }

      if (scope.owner === node) {
        popScope();
      }
    },
  });

  // let reflen = rootScope.references.length;
  // while (reflen--) {
  //   const ref = rootScope.references[reflen];
  //   if (ref instanceof Reference) {
  //     const decl = rootScope.declarations.get(ref.id.name);
  //     if (decl && rootScope.unused.has(decl)) {
  //       rootScope.unused.delete(decl);
  //     }
  //   }
  // }

  const closeResult = rootScope.close();
  // if (!opts.ssr) {
  //   references = closeResult[0];

  //   for (const node of closeResult[1]) {
  //     if (node.type === 'FunctionDeclaration') {
  //       stripNode(node, magicString);
  //     } else if (node.type === 'ClassDeclaration') {
  //       stripNode(node, magicString);
  //     }
  //   }

  //   for (const node of ast.body) {
  //     if (node.type === 'ExportNamedDeclaration') {
  //       const decl = node.declaration!;
  //       if (rootScope.unused.has(decl)) {
  //         magicString.remove(node.start, decl.start);
  //       }
  //     }
  //   }
  // } else {
  // }
  const references = rootScope.references;
  // updateReferences(references, magicString, rootAliases);
  // updateScopeReferences(magicString, rootScope);
  updateScopeReferences(magicString, rootScope);

  // const ssr = opts.ssr ?? true;
  const stack = [rootScope];
  const tasks: TransformTask[] = [];
  while (stack.length) {
    const scope = stack.pop()!;
    updateTaskReference(magicString, scope);

    for (const child of scope.children) {
      stack.push(child);
    }

    for (const task of scope.tasks) {
      tasks.push(task);
      // if (!opts.ssr && scope.unused.has(task.node)) continue;

      // if (parentUsed) {
      updateScopeTaskReference(magicString, task);
      // }

      const [args, params] = updateScopeReferences(magicString, task.scope);

      task.params.length = 0;
      for (const p of params) task.params.push(p);

      // updateReferences(task.scope.references, magicString, aliases);
      // task.scope.updateReferences(magicString, aliases);

      if (task.type === TransformTaskType.ExportFuncDeclaration) {
        // const params = args.map((a) => aliases[a]);
        exportFuncClosure(
          magicString,
          task.scope.rootStart,
          task,
          params,
          args
        );

        // const funcAlias =
        //   params.length > 0 ? `${task.alias}(${params.join(',')})` : task.alias;

        // task.scope.parent!.updateReferences(magicString, {
        //   [task.id]: funcAlias,
        // });
      } else exportFuncExpression(magicString, task);
    }
  }

  if (opts.includeHelper === undefined || opts.includeHelper === true) {
    magicString.append(CLOSURE_HELPER);
  }

  const closures = tasks.map((t) => new Closure(t.alias, clientScript(t)));

  function clientScript(t: TransformTask) {
    const body = magicString.original.slice(t.node.start, t.node.end);
    return `export const ${t.alias} = ` + body;
  }

  return {
    code: magicString.toString(),
    map: magicString.generateMap(),
    closures,
  };
}

function __alias(
  str: string,
  { id, start, end }: { id?: Identifier | null; start: number; end: number },
  exportIndex: number
) {
  const baseName = id ? id.name.slice(0, 5) : '';
  const maxLen = 10 - baseName.length;
  const bits = new Int8Array({ length: maxLen }).fill(
    (Math.abs(start - exportIndex - 97) % (122 - 97)) + 97
  );
  for (let i = 0, len = end - start + 1; i < len; i++) {
    const u = i % maxLen;
    const c = str.charCodeAt(i + start) ^ bits[u];

    bits[u] = (Math.abs(c - 97) % (122 - 97)) + 97;
  }

  const retval = baseName + '$' + String.fromCharCode(...bits);

  return retval;
}

function throwNever(message: string, type: never) {
  throw Error(message + type);
}

type Replacement = {
  content: string;
  task?: ExportFuncDeclaration;
};

// export type Closure = {
//   isRoot: boolean;
//   parent: TypedNode;
//   node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression;
//   args?: string[];
//   id: string;
// };

class Reference {
  constructor(public id: Identifier, public scope: Scope) {}
}

class Scope {
  public readonly declarations = new Map<string, string>();
  public readonly references: (Reference | ThisExpression)[] = [];
  public readonly closures = new Map<string, [string, TypedNode, Scope]>();
  // public readonly aliases = new Map<string, Replacement>();
  public readonly tasks: TransformTask[] = [];
  public readonly dependents: [TypedNode, TypedNode][] = [];
  public readonly unused = new Set<TypedNode>();
  public readonly children: Scope[] = [];
  public readonly bindings: ScopeBinding[] = [];

  constructor(
    public rootStart: number,
    public owner: TypedNode,
    public thisable: boolean,
    public parent?: Scope
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  close() {
    const references: Scope['references'] = [];

    for (const ref of this.references) {
      if (ref instanceof Reference) {
        if (this.declarations.has(ref.id.name)) {
          // const decl = blockScope.declarations.get(ref.id.name)!;
          // blockScope.unused.delete(decl);
        } else {
          const [refScope, b] = this.resolve(ref);
          if (refScope) {
            if (this.closures.has(ref.id.name)) {
              const [alias, _, cl] = this.closures.get(ref.id.name)!;
              const args = [...cl.bindings.keys()].join(', ');
              this.bindings.push(
                new ScopeBinding(
                  `${alias}(${args})`,
                  ref.id.name,
                  cl.bindings.map((b) => b.arg)
                )
              );
            } else {
              references.push(ref);
              this.bindings.push(
                new ScopeBinding(ref.id.name, ref.id.name, [])
              );
            }
          }
        }
      } else if (!this.thisable) {
        this.bindings.push(
          new ScopeBinding('this', 'this_' + this.rootStart, [])
        );
        references.push(ref);
      }
    }

    return [references, this.unused] as const;
  }

  get root() {
    let scope: Scope = this;
    while (scope.parent) {
      scope = scope.parent;
    }
    return scope;
  }

  resolve(
    ref: this['references'][number]
  ): readonly [Scope, string] | readonly [null, null] {
    let scope: Scope | undefined = this;
    while (scope) {
      if (ref instanceof Reference) {
        if (scope.declarations.has(ref.id.name))
          return [scope, scope.declarations.get(ref.id.name)!] as const;
        if (scope.closures.has(ref.id.name))
          return [scope.root, scope.closures.get(ref.id.name)![0]] as const;
      } else if (scope.thisable) {
        return [scope, 'this_' + scope.owner.start] as const;
      }
      scope = scope.parent;
    }
    return [null, null];
  }

  get isRoot() {
    return !this.parent;
  }

  // paramsAndArgs() {
  //   const scope = this;
  //   const aliases: Record<string, string> = {};
  //   for (const [name, [alias, cl]] of scope.closures) {
  //     aliases[name] = alias;
  //   }
  //   for (const ref of scope.references) {
  //     const [refScope, alias] = this.resolve(ref);
  //     if (refScope !== null && refScope != scope) {
  //       // use magic to get alias of ref
  //       // const refName = magicString.slice(ref.start, ref.end);
  //       if (ref instanceof Reference) {
  //         const refName = ref.id.name;
  //         aliases[refName] = alias || refName;
  //       } else {
  //         const replacement = `this_${refScope.owner.start}`;
  //         aliases['this'] = replacement;
  //       }
  //     }
  //   }

  //   return aliases;
  // }

  // getTrapped(references: Identifier[]) {
  //   const result: string[] = [];
  //   for (const id of references) {
  //     const name = id.name;
  //     if (this.isTrapped(name) && !result.includes(name)) result.push(name);
  //   }
  //   return result;
  // }

  // isTrapped(variable: string) {
  //   const { declarations } = this;
  //   if (declarations.has(variable)) {
  //     return false;
  //   }

  //   let scope: Scope | undefined = this.parent;
  //   while (scope) {
  //     if (scope.declarations.has(variable)) {
  //       const decl = scope.declarations.get(variable);
  //       const root = scope.root;

  //       for (const task of root.tasks) {
  //         if (task.node === decl) {
  //           return false;
  //         }
  //       }

  //       return true;
  //     }
  //     scope = scope.parent;
  //   }

  //   // unresolved variable.
  //   return false;
  // }

  updateReferences(magicString: MagicString, aliases: Record<string, string>) {
    updateReferences(this.references, magicString, aliases);
  }
}

enum TransformTaskType {
  ExportFuncDeclaration,
  ExportFuncExpression,
}

type TransformTask = ExportFuncDeclaration | ExportFuncExpression;

interface ExportFuncDeclaration {
  type: TransformTaskType.ExportFuncDeclaration;
  scope: Scope;
  parent: TypedNode;
  node:
    | FunctionDeclaration
    | ArrowFunctionExpression
    | FunctionExpression
    | ClassDeclaration
    | ClassExpression;
  // args?: string[];
  isRoot: boolean;
  alias: string;
  params: string[];
  id: string;
}

interface ExportFuncExpression {
  type: TransformTaskType.ExportFuncExpression;
  parent: TypedNode;
  node: FunctionExpression | ArrowFunctionExpression | ClassExpression;
  scope: Scope;
  isRoot: boolean;
  alias: string;
  params: string[];
}

function exportFuncExpression(
  magicString: MagicString,
  task: ExportFuncExpression
) {
  const { parent, node, scope, isRoot, alias } = task;
  if (
    (parent.type === 'Property' && parent.method && parent.kind === 'init') ||
    parent.type === 'MethodDefinition'
  ) {
    if (
      node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression'
    ) {
      if (node.async) {
        // magicString.remove(parent.start, parent.key.start);
        magicString.prependRight(node.start, 'async function ');
      } else magicString.prependRight(node.start, 'function ');
    }

    const args = scope.bindings.map((e) => e.arg);
    const params = scope.bindings.map((e) => e.param);

    exportFuncClosure(
      magicString,
      scope.rootStart,
      {
        parent,
        node,
        isRoot,
        alias: alias,
        id: alias,
      },
      params,
      args
    );
    // const [id, args] = exportFunction(node, funcScope);

    // if (args.length > 0) {
    //   magicString.appendLeft(node.start, `(${args.join(',')})`);
    // }
  } else if (!isRoot) {
    //   //       const funcNode = node as any as acorn.Node;
    const id = __alias(magicString.original, node, scope.rootStart);
    // subsctitute expression reference
    // magicString.appendLeft(node.start, `${id}`);

    magicString.appendRight(node.start, `export const ${id} = `);

    const args = scope.bindings.map((e) => e.arg);
    const params = scope.bindings.map((e) => e.param);

    if (args.length > 0) {
      // magicString.appendLeft(node.start, `(${args.join(',')})`);
      magicString.appendRight(node.start, `(${params.join(',')}) => `);
      magicString.appendLeft(node.end, `, [${params.join(',')}]`);
    }
    // export definition
    magicString.appendRight(node.start, `__closure("${id}", `);
    magicString.appendLeft(node.end, `);`);
    magicString.move(node.start, node.end, scope.rootStart);
  }
}

function exportFuncClosure(
  magicString: MagicString,
  exportIndex: number,
  closure: Pick<
    ExportFuncDeclaration,
    'isRoot' | 'parent' | 'alias' | 'node' | 'id'
  >,
  params: readonly string[],
  args: readonly string[]
) {
  const { isRoot, parent, alias, node, id } = closure;

  if (isRoot) {
    if (params && params.length > 0) {
      // magicString.appendLeft(node.start, `(${args.join(',')})`);
      magicString.appendLeft(node.end, `, [${params.join(',')}]`);
      magicString.appendRight(
        node.start,
        `;export const ${alias} = ` +
          `(${params.join(',')}) => __closure("${alias}", `
      );
    } else {
      magicString.appendRight(
        node.start,
        `;export const ${alias} = __closure("${alias}", `
      );
    }
    magicString.appendLeft(node.end, `);\n`);

    magicString.move(node.start, node.end, exportIndex);

    if (parent.type === 'ExportDefaultDeclaration') {
      // magicString.appendRight(
      //   node.start,
      //   `const ${alias} = __closure("${alias}", `
      // );
      // magicString.appendLeft(node.end, `);`);
      // magicString.appendLeft(node.start, ` ${alias};`);
      // magicString.move(node.start, node.end, exportIndex);
    } else if (parent.type === 'ExportNamedDeclaration') {
      magicString.appendLeft(
        node.start,
        `const ${id} = ${alias}(${args.join(',')});`
      );
      // magicString.appendLeft(node.end, `;__closure("${alias}", ${alias});`);
    } else if (parent.type === 'Program') {
      // magicString.appendRight(node.start, `export `);
      // magicString.appendLeft(node.end, `;__closure("${alias}", ${alias});`);
    }
  } else {
    if (params && params.length > 0) {
      // magicString.appendLeft(node.start, `(${args.join(',')})`);
      magicString.appendLeft(node.end, `, [${params.join(',')}]`);
      magicString.prependRight(
        node.start,
        `;export const ${alias} = (${params.join(
          ','
        )}) => __closure("${alias}", `
      );
    } else {
      magicString.prependRight(
        node.start,
        `;export const ${alias} = __closure("${alias}", `
      );
    }

    magicString.appendLeft(node.end, `);\n`);
    magicString.move(node.start, node.end, exportIndex);
  }
}

// function stripNode(
//   root: FunctionDeclaration | ClassDeclaration,
//   magicString: MagicString
// ) {
//   let start = root.start;

//   walk(root.body, {
//     enter(n, p) {
//       if (
//         n.type === 'FunctionDeclaration' ||
//         n.type === 'FunctionExpression' ||
//         n.type === 'ArrowFunctionExpression' ||
//         n.type === 'ClassDeclaration' ||
//         n.type === 'ClassExpression'
//       ) {
//         magicString.remove(start, n.start);
//         start = n.end;

//         this.skip();
//       }
//     },
//   });

//   magicString.remove(start, root.end);
// }

function updateTaskReference(magicString: MagicString, scope: Scope) {
  const aliases: Record<string, string> = {};
  for (const ref of scope.references) {
    const [refScope] = scope.resolve(ref);
    if (refScope !== null && refScope != scope && !refScope.isRoot) {
      // use magic to get alias of ref
      // const refName = magicString.slice(ref.start, ref.end);
      if (ref instanceof Reference) {
        const refName = ref.id.name;
        const decl = refScope.declarations.get(refName)!;
        aliases[refName] = decl || refName;
      } else {
        const replacement = `this_${refScope.owner.start}`;
        aliases['this'] = replacement;
      }
    }
  }
}

function updateScopeTaskReference(
  magicString: MagicString,
  task: TransformTask
) {
  const bindings = task.scope.bindings;
  const args = bindings.map((b) => b.arg);

  let funcAlias =
    args.length > 0 ? `(${task.alias}(${args.join(',')}))` : task.alias;

  if (task.type === TransformTaskType.ExportFuncExpression) {
    const { parent } = task;

    switch (parent.type) {
      case 'MethodDefinition':
        if (parent.static) {
          magicString.overwrite(parent.start, parent.key.start, 'static ');
        } else {
          magicString.remove(parent.start, parent.key.start);
        }
        magicString.appendLeft(parent.key.end, ' = ' + funcAlias);
        break;
      case 'Property':
        if (parent.method) {
          magicString.remove(parent.start, parent.key.start);
          magicString.appendLeft(task.node.start, ' : ' + funcAlias);
        } else {
          magicString.appendLeft(task.node.start, funcAlias);
        }
        break;
      default:
        magicString.appendLeft(task.node.start, funcAlias);
        break;
    }
  }
}

function updateScopeReferences(magicString: MagicString, scope: Scope) {
  const args = new Set<string>();
  const params = new Set<string>();
  for (const ref of scope.references) {
    const [refScope, alias] = scope.resolve(ref);
    if (refScope !== null && refScope !== scope) {
      // use magic to get alias of ref
      // const refName = magicString.slice(ref.start, ref.end);
      if (ref instanceof Reference) {
        const refName = ref.id.name;
        args.add(alias || refName);
        params.add(refName);
        // const args = Object.keys(declTask.scope.paramsAndArgs());
        // let declAlias =
        //   args.length > 0
        //     ? `(${declTask.alias}(${args.join(',')}))`
        //     : declTask.alias;

        // magicString.overwrite(ref.id.start, ref.id.end, `(${declAlias})`);
      } else if (scope !== refScope) {
        const replacement = `this_${refScope.owner.start}`;
        magicString.overwrite(ref.start, ref.end, `(${replacement})`);
      }
    }
  }

  return [[...args], [...params]] as const;
}

function updateReferences(
  references: Scope['references'],
  magicString: MagicString,
  aliases: Record<string, string>
) {
  for (const ref of references) {
    if (ref instanceof Reference) {
      const alias = aliases[ref.id.name];
      if (alias) {
        magicString.overwrite(ref.id.start, ref.id.end, `(${alias})`);
      }
    } else if (ref.type === 'ThisExpression') {
      const alias = aliases['this'];
      if (alias) magicString.overwrite(ref.start, ref.end, `(${alias})`);
    }
  }
}

class Closure {
  constructor(public readonly name: string, public readonly code: string) {}
}

class ScopeBinding {
  constructor(
    public arg: string,
    public param: string,
    public paramArgs: string[]
  ) {}
}
