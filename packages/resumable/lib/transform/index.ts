import { Literal, Program } from 'estree';
import MagicString from 'magic-string';
import { parse } from './parse';
import { Closure, Scope } from './scope';

declare module 'estree' {
  export interface BaseNode {
    start: number;
    end: number;
  }
}

export const CLOSURE_HELPER = `
function __$C(fn, name, args) { return Object.assign(fn, {__src: import.meta.url, __name: name, __args: args}) }
function __$R(name) { return {__ref: name} }
`;

export type TransfromOptions = {
  includeHelper?: boolean;
  selectClosures?(root: Scope, program?: Program): Closure[];
};

export function transform(
  code: string,
  opts: TransfromOptions
): { code: string; map: any } | undefined {
  const [rootScope, program, imports] = parse(code);
  const magicString = new MagicString(code);

  updateImports(magicString, imports);

  const closures =
    opts.selectClosures instanceof Function
      ? opts.selectClosures(rootScope, program)
      : selectAllClosures(rootScope);

  function hasClosure(cl: Closure) {
    return closures.includes(cl);
  }
  for (const closure of closures) {
    exportClosure(magicString, closure, hasClosure);
  }

  if (opts.includeHelper === undefined || opts.includeHelper === true) {
    magicString.append(CLOSURE_HELPER);
  }

  return {
    code: magicString.toString(),
    map: magicString.generateMap(),
  };
}

function updateImports(magicString: MagicString, imports: Literal[]) {
  for (const source of imports) {
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

function getBindings(
  closure: Closure,
  hasClosure: (cl: Closure) => boolean,
  stack = new Set()
) {
  const bindings = new Map<string, string | Closure>();

  if (stack.has(closure)) {
    return bindings;
  }
  stack.add(closure);

  for (const cl of closure.scope.closures) {
    if (hasClosure(cl)) {
      bindings.set(cl.exportName, cl);
    }
  }

  for (const ref of closure.scope.references) {
    if (ref instanceof Closure) {
      if (hasClosure(ref)) {
        bindings.set(ref.exportName, ref);
      }
    } else if (ref.type === 'Identifier') {
      if (
        !closure.scope.declarations.has(ref.name) &&
        resolve(closure.scope.parent, ref.name)
      ) {
        bindings.set(ref.name, ref.name);
      }
    } else if (!closure.scope.thisable) {
      bindings.set('this_' + closure.scope.owner.start, 'this');
    }
  }

  return bindings;

  function resolve(leaf: Scope | undefined, ref: string) {
    let scope: Scope | undefined = leaf;
    while (scope) {
      // if (scope.exports.has(ref)) return true;
      if (scope.declarations.has(ref)) return true;
      scope = scope.parent;
    }
    return false;
  }
}

function formatBindings(
  bindings: Map<string, string | Closure>,
  stack = new Set()
) {
  if (stack.has(bindings)) {
    debugger;
    return [];
  }

  stack.add(bindings);

  const args: string[] = [];
  const params: string[] = [];
  const deps: string[] = [];

  for (const [k, arg] of bindings) {
    params.push(k);
    if (typeof arg === 'string') {
      deps.push(k);
      args.push(arg);
    } else {
      deps.push(`__$R("${arg.exportName}")`);
      args.push(arg.exportName);
    }
  }

  return [params, args.join(', '), deps] as const;
}

function exportClosure(
  magicString: MagicString,
  closure: Closure,
  hasClosure: (cl: Closure) => boolean
) {
  const { owner, rootStart } = closure.scope;

  const bindings = getBindings(closure, hasClosure);
  const [params, args, deps] = formatBindings(bindings);

  if (owner.start !== rootStart) {
    magicString.move(owner.start, owner.end, rootStart);
  }
  magicString.appendRight(
    owner.start,
    `export function ${closure.exportName}(${params.join(', ')}) {\n`
  );
  magicString.appendRight(owner.start, `return __$C(`);
  magicString.appendLeft(owner.end, `\n,"${closure.exportName}"`);
  if (deps.length) {
    magicString.appendLeft(owner.end, `, [${deps}]`);
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
  // if (parentScope) {
  //   for (const ref of parentScope.references) {
  //     if (ref instanceof Closure) {
  //     } else if (ref.type === 'Identifier') {
  //       // if (ref.name === closureName)
  //       // magicString.overwrite(ref.start, ref.end, refSubstitute);
  //     } else {
  //       // magicString.overwrite(
  //       //   ref.start,
  //       //   ref.end,
  //       //   '__this_' + closure.parent.start
  //       // );
  //     }
  //   }
  // }

  const closureInitExpr = formatInit(closure.exportName, args);

  // ============== FunctionDeclaration ================

  if (
    closure.parent.type === 'BlockStatement' ||
    closure.parent.type === 'Program'
  ) {
    if (
      owner.type === 'FunctionDeclaration' ||
      owner.type === 'FunctionExpression' ||
      owner.type === 'ClassDeclaration'
    ) {
      if (owner.id) {
        magicString.appendLeft(
          owner.start,
          `const ${owner.id.name} = ${closureInitExpr};\n`
        );
      }
    } else {
      console.log(owner.type);
    }

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
function selectAllClosures(rootScope: Scope): Closure[] {
  const stack: Scope[] = [rootScope];

  const retval: Closure[] = [];
  while (stack.length) {
    const scope = stack.pop()!;
    retval.push(...scope.closures);

    for (const child of scope.children) {
      stack.push(child);
    }
  }

  return retval;
}
