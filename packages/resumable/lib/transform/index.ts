import MagicString from 'magic-string';
import { parse } from './parse';
import { Closure, Scope } from './scope';

declare module 'estree' {
  export interface BaseNode {
    start: number;
    end: number;
  }
}

export const CLOSURE_HELPER = `;function __$(name, fn, args) { return Object.assign(fn, {__src: import.meta.url, __name: name, __args: args}) }`;

export type TransfromOptions = {
  // entry: string[];
  // ssr?: boolean;
  includeHelper?: boolean;
  filter?(name: string): boolean;
};

export function transform(
  code: string,
  opts: TransfromOptions
): { code: string; map: any } | undefined {
  const rootScope = parse(code, opts.filter || (() => true));
  const magicString = new MagicString(code);
  const stack = [rootScope];
  while (stack.length) {
    const scope = stack.pop()!;
    stack.push(...scope.children);

    updateImports(magicString, scope);

    for (const [cname, cl] of scope.exports) {
      exportClosure(magicString, cname, cl);
    }
  }

  if (opts.includeHelper === undefined || opts.includeHelper === true) {
    magicString.append(CLOSURE_HELPER);
  }

  return {
    code: magicString.toString(),
    map: magicString.generateMap(),
  };
}

// function throwNever(message: string, type: never) {
//   throw Error(message + type);
// }

function updateImports(magicString: MagicString, scope: Scope) {
  for (const source of scope.imports) {
    if (source) {
      const match = source.raw?.match(/\.[jt]sx?/);
      if (match) {
        magicString.appendRight(source.start + 1, '/@resumable');
      } else {
        console.error(source);
      }
    }
  }
}

function getBindings(closure: Closure) {
  const bindings = new Map<string, string | [string, Closure]>();
  for (const ref of closure.scope.references) {
    if (ref instanceof Closure) {
      bindings.set(ref.exportName, ref.exportName);
    } else if (ref.type === 'Identifier') {
      if (
        closure.scope.exports.has(ref.name) ||
        !closure.scope.declarations.has(ref.name)
      ) {
        const decl = resolve(closure.scope, ref.name);

        if (decl) {
          if (decl instanceof Closure) {
            bindings.set(decl.exportName, [ref.name, decl]);
          } else {
            bindings.set(ref.name, ref.name);
          }
        }
      }
    } else if (!closure.scope.thisable) {
      bindings.set('this_' + closure.scope.owner.start, 'this');
    }
  }

  for (const [n, cl] of closure.scope.exports) {
    bindings.set(cl.exportName, cl.exportName);
  }

  return bindings;

  function resolve(leaf: Scope, ref: string): Closure | string | null {
    let scope: Scope | undefined = leaf;
    while (scope) {
      if (scope.exports.has(ref)) return scope.exports.get(ref)!;
      if (scope.declarations.has(ref)) return scope.declarations.get(ref)!;
      scope = scope.parent;
    }
    return null;
  }
}

function formatBindings(
  bindings: Map<string, string | [string, Closure]>,
  stack = new Set()
) {
  if (stack.has(bindings)) {
    debugger;
    return [];
  }

  stack.add(bindings);

  const args: string[] = [];
  const params: string[] = [];
  const inits: string[] = [];

  for (const [k, arg] of bindings) {
    params.push(k);
    if (typeof arg === 'string') {
      args.push(arg);
    } else {
      const [n, cl] = arg;
      // const bindings = getBindings(cl);
      args.push(cl.exportName);
      // if (bindings.size) {
      //   const [_, nestedArgs] = formatBindings(bindings, stack);
      //   // inits.push(`const ${n} = ${cl.exportName}(${nestedArgs});`);
      // } else {
      //   // inits.push(`const ${n} = ${cl.exportName};`);
      // }
    }
  }

  return [params.join(', '), args.join(', '), inits] as const;
}

function exportClosure(
  magicString: MagicString,
  closureName: string,
  closure: Closure
) {
  const { owner, rootStart } = closure.scope;

  const bindings = getBindings(closure);
  const [params, args, inits] = formatBindings(bindings);

  if (owner.start !== rootStart) {
    magicString.move(owner.start, owner.end, rootStart);
  }
  magicString.appendRight(
    owner.start,
    `export function ${closure.exportName}(${params}) {\n`
  );
  magicString.appendRight(
    owner.start,
    `${inits.join('\n')}\nreturn __$("${closure.exportName}", `
  );
  magicString.appendLeft(owner.end, `\n`);
  if (params) {
    magicString.appendLeft(owner.end, `, [${params}]`);
  }
  magicString.appendLeft(owner.end, ');\n}\n');

  const refSubstitute = formatInit(closure.exportName, args);

  const parentScope = closure.scope.parent;
  for (const ref of closure.scope.references) {
    if (ref instanceof Closure) {
    } else if (ref.type === 'ThisExpression') {
      if (!closure.scope.thisable) {
        magicString.overwrite(
          ref.start,
          ref.end,
          'this_' + closure.scope.owner.start
        );
      }
    }
  }
  if (parentScope) {
    for (const ref of parentScope.references) {
      if (ref instanceof Closure) {
      } else if (ref.type === 'Identifier') {
        if (ref.name === closureName)
          magicString.overwrite(ref.start, ref.end, refSubstitute);
      } else {
        // magicString.overwrite(
        //   ref.start,
        //   ref.end,
        //   '__this_' + closure.parent.start
        // );
      }
    }
  }

  const closureInitExpr = formatInit(closure.exportName, args);

  // ============== FunctionDeclaration ================

  if (
    closure.parent.type === 'BlockStatement' ||
    closure.parent.type === 'Program'
  ) {
    // skip initialize
  } else if (closure.parent.type === 'ExportNamedDeclaration') {
    if (
      owner.type === 'FunctionDeclaration' ||
      owner.type === 'ClassDeclaration'
    ) {
      magicString.appendLeft(owner.start, 'const ' + owner.id!.name + ' = ');
    }

    magicString.appendLeft(owner.start, closureInitExpr);
  } else if (closure.parent.type === 'ExportDefaultDeclaration') {
    if (owner.type === 'FunctionDeclaration') {
      if (owner.id) {
        magicString.appendRight(
          closure.parent.start,
          `const ${owner.id.name} = ${closureInitExpr};\n`
        );
        magicString.appendLeft(owner.start, owner.id.name);
      } else {
        magicString.appendLeft(owner.start, closureInitExpr);
      }
    } else {
      magicString.appendLeft(owner.start, closure.exportName);
    }
  } else {
    if (closure.parent.type === 'MethodDefinition') {
      magicString.appendLeft(owner.start, ' = ');

      const parent = closure.parent;

      if (parent.value.async) {
        magicString.appendRight(owner.start, 'async function');
      } else {
        magicString.appendRight(owner.start, 'function ');
      }

      if (parent.static) {
        magicString.overwrite(parent.start, parent.key.start, 'static ');
      } else {
        magicString.remove(parent.start, parent.key.start);
      }
    } else if (closure.parent.type === 'Property') {
      if (closure.parent.method) {
        magicString.appendLeft(owner.start, ' : ');

        const prefix = magicString.slice(
          closure.parent.start,
          closure.parent.key.start
        );

        magicString.remove(closure.parent.start, closure.parent.key.start);

        magicString.appendRight(owner.start, prefix + 'function ');
      } else {
      }
    }

    // ============== Default ================
    if (
      owner.type === 'FunctionDeclaration' ||
      owner.type === 'FunctionExpression' ||
      owner.type === 'ArrowFunctionExpression' ||
      owner.type === 'ClassDeclaration' ||
      owner.type === 'ClassExpression'
    ) {
      magicString.appendLeft(owner.start, closureInitExpr);
    } else {
      console.log(owner.type);
    }
  }
}

function formatInit(ref: string, args: string) {
  return `(${ref}(${args}))`;
}
