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
  ssr?: boolean;
  includeHelper?: boolean;
};

export function transform(
  code: string,
  opts: TransfromOptions = { ssr: true }
): { code: string; map: any } | undefined {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
  }) as Program;

  const rootScope = new Scope(ast, false);
  const scopes = [rootScope];
  const magicString = new MagicString(code);

  for (const root of ast.body) {
    const exportIndex = root.start;
  }
  const exportIndex =
    ast.body.find((n) => n.type !== 'ImportDeclaration')?.start ?? 0;

  // magicString.prependLeft(exportIndex, ';');

  const skipEnter = new Map<TypedNode, 'deep' | 'shallow'>();

  walk(ast, {
    enter(n, p) {
      const node = n as TypedNode;
      const parent = (p || ast) as TypedNode;
      let scope = scopes[scopes.length - 1]!;

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
        if (opts.ssr) {
          if (CSS_LANGS_RE.test(node.source.value as string)) {
            magicString.remove(node.start, node.end);
            this.skip();
          } else {
            const source = node.source.raw;
            if (source) {
              const match = source.match(/\.[jt]sx?/);
              if (match) {
                magicString.appendLeft(
                  node.source.start + (match.index || 0),
                  '.resume'
                );
              } else {
                console.error(source);
              }
            }
          }
        } else {
          magicString.remove(node.start, node.end);
          this.skip();
        }
      } else if (
        node.type === 'ClassDeclaration' ||
        node.type === 'ClassExpression'
      ) {
        const classScope = new Scope(node, true, scope);
        scopes.push(classScope);

        if (node.id) {
          scope.unused.add(node);

          skipEnter.set(node.id, 'deep');
          scope.declarations.set(node.id.name, node);
        }
      } else if (
        node.type === 'MethodDefinition' ||
        node.type === 'PropertyDefinition' ||
        node.type === 'Property'
      ) {
        skipEnter.set(node.key, 'deep');

        if (node.type === 'MethodDefinition' && node.kind === 'constructor')
          skipEnter.set(node.value, 'shallow');

        const memberScope = new Scope(node, true, scope);
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
          node,
          node.type !== 'ArrowFunctionExpression',
          scope
        );
        for (const [v, n] of variableFromPatterns(node.params)) {
          funcScope.declarations.set(v, n);
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
            scope.declarations.set(funName, node);
          }
        }
      } else if (node.type === 'MemberExpression') {
        skipEnter.set(node.property!, 'deep');
      } else if (
        node.type === 'ForStatement' ||
        node.type === 'WhileStatement'
      ) {
        scopes.push(new Scope(node, false, scope));
      } else if (node.type === 'VariableDeclaration') {
        for (const declarator of node.declarations) {
          skipEnter.set(declarator.id, 'deep');
          for (const [v, n] of variableFromPatterns([declarator.id])) {
            scope.declarations.set(v, n);
          }
        }
      } else if (node.type === 'Identifier') {
        scope.addReference(new Reference(node, scope));
      } else if (node.type === 'ThisExpression') {
        scope.addReference(node);
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

      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'ClassDeclaration'
      ) {
        if (isRoot) {
          const id =
            parent.type === 'ExportDefaultDeclaration'
              ? node.id?.name ?? __id(code, parent, exportIndex)
              : node.id!.name;
          scope.parent!.tasks.push({
            type: TransformTaskType.ExportFuncDeclaration,
            scope,
            isRoot,
            parent,
            node,
            alias: id,
            id,
          });
        } else {
          // const [_, args] = scope.paramsAndArgs();
          // const args: string[] = uniqueParams(scope.trappedReferences());
          //   const args = funcScope.getTrapped(references);

          const alias = __id(code, node, exportIndex);

          // scope.parent!.aliases.set(node.id!.name, {
          //   content: args.length ? `${alias}(${args.join(',')})` : alias,
          // });

          scope.parent!.tasks.push({
            type: TransformTaskType.ExportFuncDeclaration,
            scope,
            alias: alias,
            isRoot: false,
            node,
            parent,
            id: node.id!.name,
          });
        }
      } else if (
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression' ||
        node.type === 'ClassExpression'
      ) {
        const alias = __id(code, node, exportIndex);

        if (parent.type !== 'MethodDefinition' || parent.kind === 'method') {
          scope.parent!.tasks.push({
            type: TransformTaskType.ExportFuncExpression,
            parent,
            node,
            isRoot,
            scope,
            alias,
          });
        }
      }

      if (scope.owner === node) {
        popScope();
      }
    },
  });

  let reflen = rootScope.references.length;
  while (reflen--) {
    const ref = rootScope.references[reflen];
    if (ref instanceof Reference) {
      const decl = rootScope.declarations.get(ref.id.name);
      if (decl && rootScope.unused.has(decl)) {
        rootScope.unused.delete(decl);
      }
    }
  }

  const rootAliases = rootScope.paramsAndArgs();

  let references: Scope['references'] = [];
  const closeResult = rootScope.close();
  if (!opts.ssr) {
    references = closeResult[0];

    for (const node of closeResult[1]) {
      if (node.type === 'FunctionDeclaration') {
        stripNode(node, magicString);
      } else if (node.type === 'ClassDeclaration') {
        stripNode(node, magicString);
      }
    }

    for (const node of ast.body) {
      if (node.type === 'ExportNamedDeclaration') {
        const decl = node.declaration!;
        if (rootScope.unused.has(decl)) {
          magicString.remove(node.start, decl.start);
        }
      }
    }
  } else {
    references = rootScope.references;
  }
  updateReferences(references, magicString, rootAliases);

  const ssr = opts.ssr ?? true;
  const stack = [[rootScope, ssr] as const];
  while (stack.length) {
    const [scope, parentUsed] = stack.pop()!;
    updateTaskReference(magicString, scope);

    for (const child of scope.children) {
      stack.push([
        child,
        ssr || (parentUsed && !rootScope.unused.has(child.owner)),
      ]);
    }

    for (const task of scope.tasks) {
      if (!opts.ssr && scope.unused.has(task.node)) continue;

      if (parentUsed) {
        updateScopeTaskReference(magicString, task);
      }

      const [args, params] = updateScopeReferences(magicString, task.scope);

      // updateReferences(task.scope.references, magicString, aliases);
      // task.scope.updateReferences(magicString, aliases);

      if (task.type === TransformTaskType.ExportFuncDeclaration) {
        // const params = args.map((a) => aliases[a]);
        exportFuncClosure(magicString, exportIndex, task, args);

        // const funcAlias =
        //   params.length > 0 ? `${task.alias}(${params.join(',')})` : task.alias;

        // task.scope.parent!.updateReferences(magicString, {
        //   [task.id]: funcAlias,
        // });
      } else exportFuncExpression(magicString, exportIndex, task);
    }
  }

  if (opts.includeHelper === undefined || opts.includeHelper === true) {
    magicString.append(CLOSURE_HELPER);
  }

  return { code: magicString.toString(), map: magicString.generateMap() };
}

function __id(
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

  const retval = baseName + String.fromCharCode(...bits);

  return retval;
}

function throwNever(message: string, type: never) {
  throw Error(message + type);
}

type Replacement = {
  content: string;
  task?: ExportFuncDeclaration;
};

export type Closure = {
  isRoot: boolean;
  parent: TypedNode;
  node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression;
  args?: string[];
  id: string;
};

class Reference {
  constructor(public id: Identifier, public scope: Scope) {}
}

class Scope {
  public readonly declarations = new Map<string, TypedNode>();
  public readonly references: (Reference | ThisExpression)[] = [];
  public readonly aliases = new Map<string, Replacement>();
  public readonly tasks: TransformTask[] = [];
  public readonly dependents: [TypedNode, TypedNode][] = [];
  public readonly unused = new Set<TypedNode>();
  public readonly children: Scope[] = [];

  constructor(
    public owner: TypedNode,
    public thisable: boolean,
    public parent?: Scope
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  close() {
    const blockScope = this;
    const references: Scope['references'] = [];

    for (const ref of blockScope.references) {
      if (ref instanceof Reference) {
        if (blockScope.declarations.has(ref.id.name)) {
          const decl = blockScope.declarations.get(ref.id.name)!;
          blockScope.unused.delete(decl);
        } else {
          references.push(ref);
        }
      } else if (!blockScope.thisable) {
        references.push(ref);
      }
    }

    return [references, blockScope.unused] as const;
  }

  addReference(id: this['references'][number]) {
    this.references.push(id);
  }

  get root() {
    let scope: Scope = this;
    while (scope.parent) {
      scope = scope.parent;
    }
    return scope;
  }

  resolve(ref: this['references'][number]) {
    let scope: Scope | undefined = this;
    while (scope) {
      if (ref instanceof Reference) {
        if (scope.declarations.has(ref.id.name)) return scope;
      } else if (scope.thisable) {
        return scope;
      }
      scope = scope.parent;
    }
    return null;
  }

  get isRoot() {
    return !this.parent;
  }

  paramsAndArgs() {
    const scope = this;
    const aliases: Record<string, string> = {};
    for (const ref of scope.references) {
      const refScope = this.resolve(ref);
      if (refScope !== null && refScope != scope && !refScope.isRoot) {
        // use magic to get alias of ref
        // const refName = magicString.slice(ref.start, ref.end);
        if (ref instanceof Reference) {
          const refName = ref.id.name;
          const decl = refScope.declarations.get(refName)!;
          if (refScope.tasks.every((t) => t.node !== decl)) {
            aliases[refName] = refName;
          }
        } else {
          const replacement = `this_${refScope.owner.start}`;
          aliases['this'] = replacement;
        }
      }
    }

    return aliases;
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
    const { declarations } = this;
    if (declarations.has(variable)) {
      return false;
    }

    let scope: Scope | undefined = this.parent;
    while (scope) {
      if (scope.declarations.has(variable)) {
        const decl = scope.declarations.get(variable);
        const root = scope.root;

        for (const task of root.tasks) {
          if (task.node === decl) {
            return false;
          }
        }

        return true;
      }
      scope = scope.parent;
    }

    // unresolved variable.
    return false;
  }

  updateReferences(magicString: MagicString, aliases: Record<string, string>) {
    updateReferences(this.references, magicString, aliases);
  }
}

function variableFromPatterns(patterns: Pattern[]) {
  const vars: [string, TypedNode][] = [];
  const stack: Pattern[] = [...patterns];
  while (stack.length) {
    const pat = stack.pop()!;

    if (pat.type === 'Identifier') {
      vars.push([pat.name!, pat]);
    } else if (pat.type === 'ObjectPattern') {
      for (const p of pat.properties) {
        if (p.type === 'Property') {
          if (p.key.type === 'Identifier') {
            vars.push([p.key.name, p]);
          } else {
            debugger;
          }
        } else if (p.type === 'RestElement') {
          stack.push(p.argument);
        }
      }
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
  return vars;
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
  id: string;
}

interface ExportFuncExpression {
  type: TransformTaskType.ExportFuncExpression;
  parent: TypedNode;
  node: FunctionExpression | ArrowFunctionExpression | ClassExpression;
  scope: Scope;
  isRoot: boolean;
  alias: string;
}

function exportFuncExpression(
  magicString: MagicString,
  exportIndex: number,
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

    const aliases = scope.paramsAndArgs();

    const args = Object.keys(aliases);
    const params = args.map((x) => aliases[x]);

    exportFuncClosure(
      magicString,
      exportIndex,
      {
        parent,
        node,
        isRoot,
        alias: alias,
      },
      params
    );
    // const [id, args] = exportFunction(node, funcScope);

    // if (args.length > 0) {
    //   magicString.appendLeft(node.start, `(${args.join(',')})`);
    // }
  } else if (!isRoot) {
    //   //       const funcNode = node as any as acorn.Node;
    const aliases = scope.paramsAndArgs();

    const id = __id(magicString.original, node, exportIndex);
    // subsctitute expression reference
    // magicString.appendLeft(node.start, `${id}`);

    magicString.appendRight(node.start, `export const ${id} = `);

    const args = Object.keys(aliases);
    const params = args.map((x) => aliases[x]);

    if (args.length > 0) {
      // magicString.appendLeft(node.start, `(${args.join(',')})`);
      magicString.appendRight(node.start, `(${params.join(',')}) => `);
      magicString.appendLeft(node.end, `, [${params.join(',')}]`);
    }
    // export definition
    magicString.appendRight(node.start, `__closure("${id}", `);
    magicString.appendLeft(node.end, `);`);
    magicString.move(node.start, node.end, exportIndex);
  }
}

function exportFuncClosure(
  magicString: MagicString,
  exportIndex: number,
  closure: Pick<ExportFuncDeclaration, 'isRoot' | 'parent' | 'alias' | 'node'>,
  params: readonly string[]
) {
  const { isRoot, parent, alias, node } = closure;

  if (isRoot) {
    if (parent.type === 'ExportDefaultDeclaration') {
      magicString.appendRight(
        node.start,
        `const ${alias} = __closure("${alias}", `
      );
      magicString.appendLeft(node.end, `);`);
      magicString.appendLeft(node.start, ` ${alias};`);
      magicString.move(node.start, node.end, exportIndex);
    } else if (parent.type === 'ExportNamedDeclaration') {
      magicString.appendLeft(node.end, `;__closure("${alias}", ${alias});`);
    } else if (parent.type === 'Program') {
      magicString.appendRight(node.start, `export `);
      magicString.appendLeft(node.end, `;__closure("${alias}", ${alias});`);
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

    magicString.appendLeft(node.end, `);`);
    magicString.move(node.start, node.end, exportIndex);
  }
}

function stripNode(
  root: FunctionDeclaration | ClassDeclaration,
  magicString: MagicString
) {
  let start = root.start;

  walk(root.body, {
    enter(n, p) {
      if (
        n.type === 'FunctionDeclaration' ||
        n.type === 'FunctionExpression' ||
        n.type === 'ArrowFunctionExpression' ||
        n.type === 'ClassDeclaration' ||
        n.type === 'ClassExpression'
      ) {
        magicString.remove(start, n.start);
        start = n.end;

        this.skip();
      }
    },
  });

  magicString.remove(start, root.end);
}

function updateTaskReference(magicString: MagicString, scope: Scope) {
  const aliases: Record<string, string> = {};
  for (const ref of scope.references) {
    const refScope = scope.resolve(ref);
    if (refScope !== null && refScope != scope && !refScope.isRoot) {
      // use magic to get alias of ref
      // const refName = magicString.slice(ref.start, ref.end);
      if (ref instanceof Reference) {
        const refName = ref.id.name;
        const decl = refScope.declarations.get(refName)!;
        if (refScope.tasks.every((t) => t.node !== decl)) {
          aliases[refName] = refName;
        }
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
  const aliases = task.scope.paramsAndArgs();
  const args = Object.keys(aliases);

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
    const refScope = scope.resolve(ref);
    if (refScope !== null && !refScope.isRoot) {
      // use magic to get alias of ref
      // const refName = magicString.slice(ref.start, ref.end);
      if (ref instanceof Reference) {
        const refName = ref.id.name;
        const decl = refScope.declarations.get(refName)!;
        const declTask = refScope.tasks.find((t) => t.node === decl);
        if (!declTask) {
          if (scope !== refScope) {
            args.add(refName);
            params.add(refName);
          }
        } else {
          const args = Object.keys(declTask.scope.paramsAndArgs());
          let declAlias =
            args.length > 0
              ? `(${declTask.alias}(${args.join(',')}))`
              : declTask.alias;

          magicString.overwrite(ref.id.start, ref.id.end, `(${declAlias})`);
        }
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
