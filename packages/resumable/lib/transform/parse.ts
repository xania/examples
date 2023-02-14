import * as acorn from 'acorn';
import { walk } from 'estree-walker';
import { variableFromPatterns } from './ast/var-from-patterns';
import { Identifier, Program } from 'estree';
import { Closure, Scope } from './scope';
import { ASTNode } from './ast-node';

const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;

export function parse(code: string, filter: (name: string) => boolean) {
  const ast = acorn.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
  }) as Program;

  const rootScope = new Scope(0, ast, false);
  const scopes = [rootScope];

  let rootStart = 0;

  // magicString.prependLeft(exportIndex, ';');

  const skipEnter = new Map<ASTNode, 'deep' | 'shallow'>();

  walk(ast, {
    enter(n, p) {
      const node = n as ASTNode;
      const parent = (p || ast) as ASTNode;
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
          // this.skip();
        } else {
          scope.imports.push(node.source);
        }
      } else if (
        node.type === 'ClassDeclaration' ||
        node.type === 'ClassExpression'
      ) {
        const classScope = new Scope(rootStart, node, true, scope);
        scopes.push(classScope);

        if (node.id) {
          skipEnter.set(node.id, 'deep');
          if (filter(node.id.name)) {
            const alias = __alias(code, node, scope.rootStart);
            scope.exports.set(
              node.id.name,
              new Closure(alias, parent, classScope)
            );
          }
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
          node.type === 'FunctionExpression'
        ) {
          if (node.id) skipEnter.set(node.id!, 'deep');

          if (parent.type !== 'MethodDefinition' || parent.kind !== 'get') {
            const alias = __alias(code, node, rootStart);
            const funName = node.id?.name ?? alias;

            if (filter(funName)) {
              scope.exports.set(funName, new Closure(alias, parent, funcScope));
            } else {
              scope.declarations.set(funName, funName);
            }
          }
        } else if (node.type === 'ArrowFunctionExpression') {
          const alias = __alias(code, node, rootStart);
          scope.exports.set(alias, new Closure(alias, parent, funcScope));
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
        scope.references.push(node);
      } else if (node.type === 'ThisExpression') {
        scope.references.push(node);
      }
    },
    leave(n, p) {
      const node = n as ASTNode;
      const parent = (p || ast) as ASTNode;
      let scope = scopes[scopes.length - 1]!;

      // const isRoot =
      //   !parent ||
      //   parent.type === 'ExportDefaultDeclaration' ||
      //   parent.type === 'Program' ||
      //   parent.type === 'ExportNamedDeclaration';

      if (scope.owner === node) {
        const blockScope = scopes.pop()!;
        blockScope.mergeChildren();
      }
    },
  });

  return rootScope;
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
