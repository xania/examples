import * as acorn from 'acorn';
import {
  ArrowFunctionExpression,
  BlockStatement,
  ClassDeclaration,
  ClassExpression,
  Declaration,
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
  | PrivateIdentifier;

export type TransfromOptions = {
  // entry: string[];
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

  const rootScope = new Scope(ast);
  const scopes = [rootScope];

  const magicString = new MagicString(code);
  const exportIndex =
    ast.body.find((n) => n.type !== 'ImportDeclaration')?.start ?? 0;

  magicString.prependLeft(exportIndex, ';');

  // function exportFunction(
  //   scope: Scope,
  //   parent: TypedNode,
  //   node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
  //   args: string[]
  // ) {
  //   const alias = __id(code, node);
  //   scope.tasks.push({
  //     type: TransformTaskType.ExportFuncDeclaration,
  //     scope,
  //     alias: alias,
  //     isRoot: false,
  //     args,
  //     node,
  //     parent,
  //     id: ""
  //   });
  //   // scope.closures.push({ isRoot: false, parent, id, node, args });
  //   return alias;
  // }

  const skipEnter = new Map<TypedNode, 'deep' | 'shallow'>();

  walk(ast, {
    enter(n, p) {
      const node = n as TypedNode;
      const parent = (p || ast) as TypedNode;
      let scope = scopes[scopes.length - 1]!;

      if (skipEnter.has(node)) {
        const mode = skipEnter.get(node);
        skipEnter.delete(node);
        if (mode === 'deep') {
          this.skip();
        }
      } else if (
        node.type === 'ClassDeclaration' ||
        node.type === 'ClassExpression'
      ) {
        const classScope = new Scope(node, scope);
        scopes.push(classScope);

        if (node.id) {
          skipEnter.set(node.id, 'deep');
          scope.declarations.set(node.id.name, node);
        }
      } else if (node.type === 'PropertyDefinition') {
        skipEnter.set(node.key, 'deep');

        const memberScope = new Scope(node, scope);
        memberScope.aliases.set('this', { content: 'this_' + node.start });
        scopes.push(memberScope);
      } else if (node.type === 'MethodDefinition') {
        skipEnter.set(node.key, 'deep');

        if (node.kind === 'constructor') skipEnter.set(node.value, 'shallow');

        // const memberScope = new Scope(scope);
        // if (node.type !== 'MethodDefinition' || node.kind !== 'constructor')
        //   memberScope.aliases.set('this', { content: 'this_' + node.start });
        // scopes.push(memberScope);
      } else if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        const funcScope = new Scope(node, scope);
        for (const [v, n] of variableFromPatterns(node.params)) {
          funcScope.declarations.set(v, n);
        }
        scopes.push(funcScope);

        for (const p of node.params) skipEnter.set(p, 'deep');
        if (node.type === 'FunctionDeclaration') {
          funcScope.aliases.set('this', { content: 'this_' + node.start });
        }
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
        scopes.push(new Scope(node, scope));
      } else if (node.type === 'Property') {
        skipEnter.set(node.key, 'deep');
      } else if (node.type === 'VariableDeclaration') {
        for (const declarator of node.declarations) {
          skipEnter.set(declarator.id, 'deep');
          for (const [v, n] of variableFromPatterns([declarator.id])) {
            scope.declarations.set(v, n);
          }
        }
      } else if (node.type === 'Identifier') {
        scope.addReference(node);
      } else if (node.type === 'ThisExpression') {
        scope.references.push({ local: true, id: node });
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

        const parentScope = blockScope.parent!;
        // scopes[scopes.length - 1]!;
        // for (const ref of blockScope.trappedReferences()) {
        //   parentScope.references.push({ local: false, id: ref });
        // }

        for (const ref of blockScope.references) {
          const refName = ref.id.type === 'Identifier' ? ref.id.name : 'this';
          if (
            // !blockScope.aliases.has(refName) &&
            !blockScope.declarations.has(refName)
          ) {
            parentScope.references.push({ local: false, id: ref.id });
          }
        }

        for (const [k, r] of blockScope.aliases) {
          if (blockScope.declarations.has(k) && r.task) {
            parentScope.tasks.push(r.task);
            // parentScope.aliases.set(k, r);
          }
        }
        for (const cl of blockScope.tasks) {
          parentScope.tasks.push(cl);
        }
        // for (const [name, node] of blockScope.declarations) {
        //   if (!blockScope.references.find((ref) => ref.name === name)) {
        //     // console.log(parent.type);
        //     // magicString.remove(node.start, node.end);
        //   }
        // }
      }

      if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'ClassDeclaration'
      ) {
        if (isRoot) {
          const id =
            parent.type === 'ExportDefaultDeclaration'
              ? node.id?.name ?? __id(code, parent)
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

          const alias = __id(code, node);

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
        if (parent.type !== 'MethodDefinition' || parent.kind === 'method') {
          scope.parent!.tasks.push({
            type: TransformTaskType.ExportFuncExpression,
            parent,
            node,
            isRoot,
            scope,
          });
        }
      }

      if (scope.owner === node) {
        popScope();
      }
    },
  });

  for (const task of rootScope.tasks) {
    if (task.type === TransformTaskType.ExportFuncDeclaration) {
      const [params, args] = task.scope.paramsAndArgs();
      exportFuncClosure(magicString, exportIndex, task, args);

      const funcAlias =
        params.length > 0
          ? `${task.alias}(${[...params].join(',')})`
          : task.alias;

      task.scope.parent!.updateReferences(magicString, task.id, funcAlias);

      for (let i = 0; i < params.length; i++) {
        task.scope.updateReferences(magicString, args[i], params[i]);
      }
    } else exportFuncExpression(magicString, exportIndex, task);
  }

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
  const bits = new Int8Array({ length: maxLen }).fill(
    (Math.abs(start - 97) % (122 - 97)) + 97
  );
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

class Scope {
  public declarations = new Map<string, TypedNode>();
  public references: { local: boolean; id: Identifier | ThisExpression }[] = [];
  public aliases = new Map<string, Replacement>();
  public tasks: TransformTask[] = [];

  addReference(id: Identifier) {
    this.references.push({ local: true, id });
  }

  substitute(variable: string, recursive = true) {
    let scope: Scope | undefined = this;
    while (scope) {
      const { aliases, declarations } = scope;
      if (aliases.has(variable)) {
        return aliases.get(variable)!;
      }
      if (declarations.has(variable)) {
        return null;
      }
      if (!recursive) break;

      scope = scope.parent;
    }
    return null;
  }

  get root() {
    let scope: Scope = this;
    while (scope.parent) {
      scope = scope.parent;
    }
    return scope;
  }
  private trappedReferences() {
    const { references } = this;
    const result: (Identifier | ThisExpression)[] = [];
    for (const ref of references) {
      if (ref.id.type === 'Identifier') {
        if (this.isTrapped(ref.id.name)) {
          result.push(ref.id);
        }
      } else {
        result.push(ref.id);
      }
    }
    return result;
  }

  paramsAndArgs() {
    const scope = this;
    const trappedReferences = scope.trappedReferences();
    const params = new Set<string>();
    const args = new Set<string>();
    for (const ref of trappedReferences) {
      // use magic to get alias of ref
      // const refName = magicString.slice(ref.start, ref.end);
      if (ref.type === 'Identifier') {
        const refName = ref.name;
        const replacement = scope.substitute(refName);
        if (replacement) {
          args.add(replacement.content);
        } else args.add(refName);

        params.add(refName);
      } else {
        const replacement = scope.substitute('this');
        if (replacement) {
          args.add('this');
          params.add(replacement.content);
        }
      }
    }

    if (params.size !== args.size) throw Error('args.size !== params.size');

    return [[...params], [...args]];
  }

  constructor(public owner: TypedNode, public parent?: Scope) {}

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

  updateReferences(
    magicString: MagicString,
    searchName: string,
    replacement: string
  ) {
    if (searchName !== replacement)
      for (const ref of this.references) {
        const refName = ref.id.type === 'Identifier' ? ref.id.name : 'this';
        if (searchName === refName) {
          magicString.remove(ref.id.start, ref.id.end);
          magicString.appendLeft(ref.id.start, `(${replacement})`);
        }
      }
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
}

function exportFuncExpression(
  magicString: MagicString,
  exportIndex: number,
  task: ExportFuncExpression
) {
  const { parent, node, scope, isRoot } = task;
  if (
    (parent.type === 'Property' && parent.method && parent.kind === 'init') ||
    parent.type === 'MethodDefinition'
  ) {
    if (
      node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression'
    ) {
      if (node.async) {
        magicString.remove(parent.start, parent.key.start);
        magicString.prependRight(node.start, 'async function ');
      } else magicString.prependRight(node.start, 'function ');
    }

    const [params, args] = scope.paramsAndArgs();

    for (let i = 0; i < params.length; i++) {
      scope.updateReferences(magicString, args[i], params[i]);
    }

    // const trappedReferences = scope.trappedReferences();
    // const params: string[] = uniqueParams(trappedReferences);

    // const args = new Set<string>();
    // for (const ref of trappedReferences) {
    //   // use magic to get alias of ref
    //   const refName = magicString.slice(ref.start, ref.end);
    //   args.add(refName);
    //   // const replacement = scope.substitute(ref.name);
    //   // if (replacement) {
    //   //   replacement.nodes.push(ref);
    //   //   args.add(replacement.content);
    //   // } else {
    //   //   args.add(ref.name);
    //   // }
    // }

    // const args = funcScope.getTrapped(references);

    const alias = __id(magicString.original, node);
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
    if (parent.type === 'MethodDefinition')
      magicString.appendLeft(node.start, ' = ' + alias);
    else magicString.appendLeft(node.start, ' : ' + alias);
    if (args.length > 0) {
      magicString.appendLeft(node.start, `(${[...args].join(',')})`);
    }
  } else if (!isRoot) {
    //   //       const funcNode = node as any as acorn.Node;
    const [params, args] = scope.paramsAndArgs();
    for (let i = 0; i < params.length; i++) {
      scope.updateReferences(magicString, args[i], params[i]);
    }

    const id = __id(magicString.original, node);
    // subsctitute expression reference
    magicString.appendLeft(node.start, `${id}`);

    magicString.appendRight(node.start, `export const ${id} = `);
    if (params.length > 0) {
      magicString.appendLeft(node.start, `(${[...args].join(',')})`);
      magicString.appendRight(node.start, `(${[...params].join(',')}) => `);
      magicString.appendLeft(node.end, `, [${[...params].join(',')}]`);
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
  params: string[]
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
