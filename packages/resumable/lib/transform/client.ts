import { Program } from 'estree';
import MagicString from 'magic-string';
import { Import, parse } from './parse';
import { Closure, Scope } from './scope';
import { formatBindings, getBindings, selectAllClosures } from './utils';

declare module 'estree' {
  export interface BaseNode {
    start: number;
    end: number;
  }
}

export type TransfromOptions = {
  selectClosures?(root: Scope, program?: Program): readonly Closure[];
};

export function transformClient(
  code: string,
  opts: TransfromOptions
): { code: string; map: any } | undefined {
  const [rootScope, program, imports] = parse(code);
  const magicString = new MagicString(code);

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

  return {
    code: magicString.toString(),
    map: magicString.generateMap(),
  };
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
