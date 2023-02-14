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

    for (const [_, cl] of scope.exports) {
      exportClosure(magicString, cl);
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

function formatBindings(bindings: Map<string, string | Closure>) {
  const args: string[] = [];
  const params: string[] = [];

  for (const [k, arg] of bindings) {
    params.push(k);
    if (arg instanceof Closure) {
      if (arg.bindings.size) {
        const [_, nestedArgs] = formatBindings(arg.bindings);
        args.push(`${arg.exportName}(${nestedArgs})`);
      } else {
        args.push(arg.exportName);
      }
    } else {
      args.push(arg);
    }
  }

  return [params.join(', '), args.join(', ')];
}

function exportClosure(magicString: MagicString, closure: Closure) {
  const { owner, rootStart } = closure.scope;

  const [params, args] = formatBindings(closure.bindings);

  if (owner.start !== rootStart) {
    magicString.move(owner.start, owner.end, rootStart);
  }
  magicString.appendRight(owner.start, `export const ${closure.exportName} =`);
  if (params) {
    magicString.appendRight(owner.start, ` (${params}) =>`);
  }
  magicString.appendRight(owner.start, ` __$("${closure.exportName}", `);

  if (params) {
    magicString.appendLeft(owner.end, `, [${params}]`);
  }
  magicString.appendLeft(owner.end, ');\n');

  const refSubstitute = formatInit(closure.exportName, args);
  for (const ref of closure.references) {
    if (ref.type === 'Identifier') {
      magicString.overwrite(ref.start, ref.end, refSubstitute);
    } else {
      magicString.overwrite(ref.start, ref.end, 'this_' + closure.parent.start);
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
  if (args) {
    return `(${ref}(${args}))`;
  }
  return ref;
}
