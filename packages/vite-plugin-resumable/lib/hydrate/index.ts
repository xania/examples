const __refs: unknown[] = [];
export async function hydrate<T>(state: T): Promise<T> {
  const index = __refs.length;

  const result = { root: undefined };

  const stack: [any, number | string, unknown][] = [[result, 'root', state]];

  while (stack.length) {
    const [target, key, input] = stack.pop()!;
    if (input === null || input === undefined) {
      target[key] = input;
    } else if (input instanceof Array) {
      const output: any[] = [];
      target[key] = output;
      __refs.push(output);
      for (let i = input.length - 1; i >= 0; i--) {
        stack.push([output, i, input[i]]);
      }
    } else if (isClosureDescriptor(input)) {
      target[key] = createLazyClosure(input);
    } else if (isCtorDescriptor(input)) {
      const { __ctor, ...instance } = input;
      const module = await input.__ctor.__ldr();
      const closure = module[input.__ctor.__name];
      const Ctor = closure();
      Reflect.setPrototypeOf(instance, Ctor.prototype);
      target[key] = instance;
    } else {
      target[key] = input;
    }
  }

  return result.root as T;
}

interface ClosureDescriptor {
  __ldr: Function;
  __name: string;
  __args: any[];
}
function isClosureDescriptor(value: any): value is ClosureDescriptor {
  if (value === null || value === undefined) return false;
  return '__ldr' in value && '__name' in value;
}

function isCtorDescriptor(value: any): value is { __ctor: ClosureDescriptor } {
  if (value === null || value === undefined) return false;
  return '__ctor' in value;
}

function createLazyClosure({ __ldr, __name, __args }: ClosureDescriptor) {
  return async function lazyClosure(this: any, ...args: any[]) {
    const module = await __ldr();
    const closure = module[__name];

    if (__args) {
      return hydrate(__args).then((deps) => {
        const func = closure(...deps);
        return func.apply(this, args);
      });
    } else {
      const func = closure();
      return func.apply(this, args);
    }
  };
}
