import { Identifier, Literal, ThisExpression } from 'estree';
import { ASTNode } from './ast-node';

export class Closure {
  public bindings = new Map<string, string | Closure>();
  references: Scope['references'] = [];

  constructor(
    public exportName: string,
    public parent: ASTNode,
    public scope: Scope
  ) {}
}

export class Scope {
  public readonly declarations = new Map<string, string>();
  public readonly references: (Identifier | ThisExpression)[] = [];
  public readonly exports = new Map<string, Closure>();
  // public readonly aliases = new Map<string, Replacement>();
  public readonly dependents: [ASTNode, ASTNode][] = [];
  public readonly children: Scope[] = [];
  public readonly bindings: ScopeBinding[] = [];
  public readonly imports: Literal[] = [];

  // public params: string[] = [];

  constructor(
    public rootStart: number,
    public owner: ASTNode,
    public thisable: boolean,
    public parent?: Scope
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  mergeChildren() {
    const exportedScopes = new Set<Scope>();
    for (const [, closure] of this.exports) {
      exportedScopes.add(closure.scope);
    }

    for (const child of this.children) {
      if (!exportedScopes.has(child)) {
        for (const ref of child.references) {
          const [refScope] = child.resolve(ref);
          if (refScope !== null && refScope !== child) {
            this.references.push(ref);
          }
        }

        // this.bindings.push(...child.bindings);
      }
    }

    for (const [closureName, closure] of this.exports) {
      for (const ref of this.references) {
        if (ref.type === 'Identifier') {
          if (ref.name === closureName) {
            closure.references.push(ref);
          }
        }
      }

      for (const ref of closure.scope.references) {
        if (ref.type === 'Identifier') {
          const [refScope] = closure.scope.resolve(ref);
          if (refScope !== null) {
            if (refScope !== closure.scope) {
              const decl =
                refScope.declarations.get(ref.name) ||
                refScope.exports.get(ref.name);
              if (!decl) {
                throw Error(`declaration ${ref.name} not found in owned scope`);
              }
              closure.bindings.set(ref.name, decl);
            } else if (refScope !== this) {
              // bindingParams.add(ref.name);
            }
          }
        } else if (!closure.scope.thisable) {
          closure.bindings.set('this_' + closure.parent.start, 'this');
          closure.references.push(ref);
        }
      }

      for (const cl of traverseClosures(closure.scope)) {
        closure.bindings.set(cl.exportName, cl.exportName);
      }

      // this.bindings.push(
      //   new ScopeBinding(closure.exportName, closure.exportName, [
      //     ...bindingParams,
      //   ])
      // );
    }

    // for (const child of this.children) {
    //   for (const ref of child.params) {
    //     if (this.declarations.has(ref)) {
    //       child.bindings.push(new ScopeBinding(ref, ref, []));
    //     } else if (this.exports.has(ref)) {
    //       const closure = this.exports.get(ref)!;
    //       child.bindings.push(
    //         new ScopeBinding(ref, closure.exportName, closure.scope.params)
    //       );
    //     } else {
    //       this.params.push(ref);
    //     }
    //   }
    // }

    // for (const child of this.children) {
    //   for (const childBinding of child.bindings) {
    //     if (this.declarations.has(childBinding.param)) {
    //       continue;
    //     } else if (this.closures.has(childBinding.param)) {
    //       const [alias, _, closureScope] = this.closures.get(
    //         childBinding.param
    //       )!;
    //       this.bindings.push(
    //         new ScopeBinding(
    //           alias,
    //           alias,
    //           closureScope.bindings.map((b) => b.arg)
    //         )
    //       );
    //     } else {
    //       this.bindings.push(childBinding);
    //     }
    //     // console.log(childBinding);
    //   }
    // }
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
      if (ref.type === 'Identifier') {
        if (scope.declarations.has(ref.name))
          return [scope, scope.declarations.get(ref.name)!] as const;
        if (scope.exports.has(ref.name))
          return [scope, scope.exports.get(ref.name)!.exportName] as const;
      } else if (scope.thisable) {
        return [scope, 'this_' + scope.owner.start] as const;
      }
      scope = scope.parent;
    }
    return [null, null];
  }
}

export class ScopeBinding {
  constructor(
    public param: string,
    public dep: string,
    public depArgs: string[]
  ) {}

  get arg() {
    if (this.depArgs.length) {
      return `${this.dep}(${this.depArgs.join(', ')})`;
    } else {
      return this.dep;
    }
  }
}

function traverseClosures(scope: Scope) {
  const closures: Closure[] = [];

  const stack: Scope[] = [scope];
  while (stack.length) {
    const curr = stack.pop()!;
    stack.push(...curr.children);

    for (const [_, cl] of curr.exports) {
      closures.push(cl);
    }
  }

  return closures;
}
