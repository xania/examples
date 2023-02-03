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
  | ForStatement
  | Program;

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

  const rootScope = new Scope();
  const scopes = [rootScope];

  const magicString = new MagicString(code);
  const exportIndex =
    ast.body.find((n) => n.type !== 'ImportDeclaration')?.start ?? 0;

  magicString.prependLeft(exportIndex, ';');

  function exportFunction(
    scope: Scope,
    parent: TypedNode,
    node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression,
    args: string[]
  ) {
    const id = __id(code, node);
    scope.closures.push({ isRoot: false, parent, id, node, args });
    return id;
  }

  const skipEnter = new Set();

  walk(ast, {
    enter(n, p) {
      const node = n as TypedNode;
      const parent = (p || ast) as TypedNode;
      let scope = scopes[scopes.length - 1]!;

      if (skipEnter.delete(node)) {
        this.skip();
      } else if (
        node.type === 'FunctionDeclaration' ||
        node.type === 'FunctionExpression' ||
        node.type === 'ArrowFunctionExpression'
      ) {
        const funcScope = new Scope(scope);
        for (const v of variableFromPatterns(node.params)) {
          funcScope.declarations.set(v, node);
        }
        scopes.push(funcScope);

        for (const p of node.params) skipEnter.add(p);
        if (node.type === 'FunctionDeclaration' && node.id) {
          skipEnter.add(node.id);
          const funName = node.id?.name;

          if (funName) {
            scope.declarations.set(funName, node);
          }
        }
      } else if (node.type === 'MemberExpression') {
        skipEnter.add(node.property);
      } else if (node.type === 'ForStatement') {
        this.skip();
      } else if (node.type === 'Property') {
        skipEnter.add(node.key);
      } else if (node.type === 'VariableDeclaration') {
        for (const declarator of node.declarations) {
          skipEnter.add(declarator.id);
          for (const v of variableFromPatterns([declarator.id])) {
            scope.declarations.set(v, node);
          }
        }
      } else if (node.type === 'Identifier') {
        scope.references.push(node);
      } else if (
        node.type === 'ClassDeclaration' ||
        node.type === 'ClassExpression'
      ) {
        this.skip();
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
        const blockScope = scopes.pop()!;
        const parentScope = scopes[scopes.length - 1]!;
        for (const ref of blockScope.trappedReferences()) {
          parentScope.references.push(ref);
        }
        for (const cl of blockScope.closures) {
          parentScope.closures.push(cl);
        }
        for (const u of blockScope.unused) {
          parentScope.unused.add(u);
        }
        for (const [name, node] of blockScope.declarations) {
          if (!blockScope.references.find((ref) => ref.name === name)) {
            parentScope.unused.add(node);
          }
        }
      }

      if (node.type === 'Identifier') {
        const idName = node.name;
        const replacement = scope.substitute(idName, false);
        if (replacement) {
          magicString.remove(node.start, node.end);
          magicString.appendLeft(node.start, replacement);
        }
      } else if (node.type === 'FunctionDeclaration') {
        if (isRoot) {
          if (parent.type === 'ExportDefaultDeclaration') {
            const id = node.id?.name ?? __id(code, parent);
            scope.closures.push({
              isRoot,
              parent,
              node,
              id,
            });
          } else {
            const id = node.id!.name;
            scope.closures.push({
              isRoot,
              parent,
              node,
              id,
            });
          }
        } else {
          const args: string[] = uniqueParams(scope.trappedReferences());
          //   const args = funcScope.getTrapped(references);
          const id = exportFunction(scope, parent, node, args);
          if (args.length > 0) {
            scope.parent?.aliases.set(node.id!.name, { id, args });
          } else {
            scope.parent?.aliases.set(node.id!.name, { id });
          }
        }
        popScope();
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

          const trappedReferences = scope.trappedReferences();
          const params: string[] = uniqueParams(trappedReferences);
          const args: string[] = unique(
            trappedReferences.map((x) => scope.substitute(x.name) ?? x.name)
          );
          // const args = funcScope.getTrapped(references);
          const id = exportFunction(scope, parent, node, params);
          // const [id, args] = exportFunction(node, funcScope);
          magicString.appendLeft(node.start, ':' + id);
          if (args.length > 0) {
            magicString.appendLeft(node.start, `(${args.join(',')})`);
          }
        } else if (!isRoot) {
          //   //       const funcNode = node as any as acorn.Node;
          const trappedReferences = scope.trappedReferences();
          const params: string[] = uniqueParams(trappedReferences);
          const args: string[] = unique(
            trappedReferences.map((x) => scope.substitute(x.name) ?? x.name)
          );
          const id = __id(code, node);
          if (id === 'narvlemiuw') debugger;
          // subsctitute expression reference
          magicString.appendLeft(node.start, `${id}`);

          magicString.appendRight(node.start, `export const ${id} = `);
          if (params.length > 0) {
            magicString.appendLeft(node.start, `(${args.join(',')})`);
            magicString.appendRight(node.start, `(${params.join(',')}) => `);
            magicString.appendLeft(node.end, `, [${params.join(',')}]`);
          }
          // export definition
          magicString.appendRight(node.start, `__closure("${id}", `);
          magicString.appendLeft(node.end, `);`);
          magicString.move(node.start, node.end, exportIndex);
        }
        popScope();
      }
    },
  });

  for (const closure of rootScope.closures) {
    const { isRoot, parent, id, args, node } = closure;
    if (isRoot) {
      if (parent.type === 'ExportDefaultDeclaration') {
        magicString.appendRight(
          node.start,
          `const ${id} = __closure("${id}", `
        );
        magicString.appendRight(parent.start, `);`);
        magicString.appendRight(parent.end, ` ${id};`);
        magicString.move(node.start, node.end, parent.start);
      } else if (parent.type === 'ExportNamedDeclaration') {
        magicString.appendLeft(node.end, `;__closure("${id}", ${id});`);
      } else if (parent.type === 'Program') {
        magicString.appendRight(node.start, `export `);
        magicString.appendLeft(node.end, `;__closure("${id}", ${id});`);
      }
    } else {
      if (args && args.length > 0) {
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
    }
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
  id: string;
  args?: string[];
};

type Closure = {
  isRoot: boolean;
  parent: TypedNode;
  node: FunctionDeclaration | FunctionExpression | ArrowFunctionExpression;
  args?: string[];
  id: string;
};

class Scope {
  public declarations = new Map<string, TypedNode>();
  public references: Identifier[] = [];
  public aliases = new Map<string, Replacement>();
  public closures: Closure[] = [];
  public unused = new Set<TypedNode>();

  substitute(variable: string, recursive = true) {
    let scope: Scope | undefined = this;
    while (scope) {
      const { aliases, declarations } = scope;
      if (aliases.has(variable)) {
        const replacement = aliases.get(variable)!;
        if (replacement.args?.length) {
          return `${replacement.id}(${replacement.args.join(',')})`;
        } else {
          return `${replacement.id}`;
        }
      }
      if (declarations.has(variable)) {
        return null;
      }
      if (!recursive) break;

      scope = scope.parent;
    }
    return null;
  }
  trappedReferences() {
    const { references } = this;
    const result: Identifier[] = [];
    for (const ref of references) {
      if (this.isTrapped(ref.name)) {
        result.push(ref);
      }
    }
    return result;
  }

  constructor(public parent?: Scope) {}

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

    let parent: Scope | undefined = this.parent;
    while (parent) {
      if (parent.declarations.has(variable)) return true;
      parent = parent.parent;
    }

    // unresolved variable.
    return false;
  }
}

function uniqueParams(references: Identifier[]) {
  const result: string[] = [];
  for (const id of references) {
    const name = id.name;
    if (!result.includes(name)) result.push(name);
  }
  return result;
}

function unique(values: string[]) {
  const result: string[] = [];
  for (const id of values) {
    const name = id;
    if (!result.includes(name)) result.push(name);
  }
  return result;
}

function variableFromPatterns(patterns: Pattern[]) {
  const vars: string[] = [];
  const stack: Pattern[] = [...patterns];
  while (stack.length) {
    const pat = stack.pop()!;

    if (pat.type === 'Identifier') {
      vars.push(pat.name!);
    } else if (pat.type === 'ObjectPattern') {
      for (const p of pat.properties) {
        if (p.type === 'Property') {
          if (p.key.type === 'Identifier') {
            vars.push(p.key.name);
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
