import { Identifier, Literal, ThisExpression } from 'estree';
import { ASTNode } from './ast-node';

export class Closure {
  // public bindings = new Map<string, string | Closure>();
  references: Scope['references'] = [];

  constructor(
    public exportName: string,
    public parent: ASTNode,
    public scope: Scope
  ) {}
}

export class Scope {
  public readonly declarations = new Map<string, ASTNode>();
  public readonly references: (Identifier | ThisExpression | Closure)[] = [];
  public readonly exports = new Map<string, Closure>();
  public readonly children: Scope[] = [];
  public readonly imports: Literal[] = [];

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
    // const exportedScopes = new Set<Scope>();
    // for (const [, closure] of this.exports) {
    //   exportedScopes.add(closure.scope);
    // }

    for (const child of this.children) {
      // if (!exportedScopes.has(child)) {
      for (const ref of child.references) {
        if (ref instanceof Closure) {
          this.references.push(ref);
        } else if (ref.type === 'Identifier') {
          if (child.exports.has(ref.name)) {
            // const cl = child.exports.get(ref.name)!;
            // cl.references.push(ref);
            // this.references.push(cl);
          } else if (!child.declarations.has(ref.name)) {
            let scope: Scope | undefined = this;
            while (scope) {
              if (scope.declarations.has(ref.name)) {
                this.references.push(ref);
                break;
              }
              scope = scope.parent;
            }
          }
        } else if (ref.type === 'ThisExpression') {
          if (!child.thisable) {
            this.references.push(ref);
          }
        }
      }
      for (const [cname, closure] of child.exports) {
        this.references.push(closure);
      }
    }

    // for (const [_, closure] of this.exports) {
    //   for (const ref of closure.scope.references) {
    //     if (ref instanceof Closure) {
    //       closure.bindings.set(ref.exportName, ref);
    //     } else if (ref.type === 'Identifier') {

    //       if (!closure.scope.declarations.has(ref.name)) {
    //         closure.bindings.set(ref.name, ref.name);
    //       }
    //     } else if (ref.type === 'ThisExpression') {
    //       if (!closure.scope.thisable) {
    //         closure.bindings.set('this_param', 'this_arg');
    //       }
    //     }
    //   }
    // }

    // for (const [closureName, closure] of this.exports) {
    //   for (const ref of this.references) {
    //     if (ref.type === 'Identifier') {
    //       if (ref.name === closureName) {
    //         closure.references.push(ref);
    //       }
    //     }
    //   }

    //   for (const ref of closure.scope.references) {
    //     if (ref.type === 'Identifier') {
    //       if (this.exports.has(ref.name)) {
    //         const decl = this.exports.get(ref.name)!;
    //         closure.bindings.set(decl.exportName, decl);
    //       } else if (this.declarations.has(ref.name)) {
    //         closure.bindings.set(ref.name, ref.name);
    //       }
    //     } else if (!closure.scope.thisable) {
    //       closure.bindings.set('this_' + closure.parent.start, 'this');
    //       closure.references.push(ref);
    //     }
    //   }

    //   // for (const ref of closure.scope.references) {
    //   //   if (ref.type === 'Identifier') {
    //   //     const [refScope] = closure.scope.resolve(ref);
    //   //     if (refScope !== null) {
    //   //       if (refScope !== closure.scope) {
    //   //         // if (refScope.exports.has(ref.name)) {
    //   //         //   const decl = refScope.exports.get(ref.name)!;
    //   //         //   closure.bindings.set(decl.exportName, decl);
    //   //         // }
    //   //         const decl =
    //   //           refScope.exports.get(ref.name) ||
    //   //           refScope.declarations.get(ref.name);
    //   //         if (!decl) {
    //   //           throw Error(`declaration ${ref.name} not found in owned scope`);
    //   //         }
    //   //         closure.bindings.set(ref.name, decl);
    //   //       } else if (refScope !== this) {
    //   //         // bindingParams.add(ref.name);
    //   //       }
    //   //     }
    //   //   } else if (!closure.scope.thisable) {
    //   //     closure.bindings.set('this_' + closure.parent.start, 'this');
    //   //     closure.references.push(ref);
    //   //   }
    //   // }

    //   // merge bindings of the current closure with the bindings of the child closures
    //   for (const cl of traverseClosures(closure.scope)) {
    //     closure.bindings.set(cl.exportName, cl.exportName);
    //     for (const [param, arg] of cl.bindings) {
    //       const stack: typeof arg[] = [arg];
    //       while (stack.length) {
    //         const curr = stack.pop()!;
    //         if (curr instanceof Closure) {
    //           stack.push(...curr.bindings.values());
    //         } else {
    //           const [paramScope] = closure.scope.resolve(curr);
    //           if (paramScope !== null && paramScope !== closure.scope) {
    //             closure.bindings.set(curr, curr);
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
  }

  // resolve(
  //   ref: this['references'][number] | string
  // ): readonly [Scope, string] | readonly [null, null] {
  //   if (typeof ref === 'string') {
  //     return resolveVarScope(this, ref);
  //   } else if (ref.type === 'Identifier') {
  //     return resolveVarScope(this, ref.name);
  //   } else return resolveThisScope(this);
  // }
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
