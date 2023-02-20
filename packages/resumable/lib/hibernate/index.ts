import { contentHash } from '../utils/content-hash';

export const primitives = ['number', 'bigint', 'boolean'];

export class Literal {
  constructor(public value: string) {}
}

export function hibernateObject(
  obj: any,
  refMap: RefMap,
  importMap: ImportMap
) {
  let retval = '';

  const stack = [obj];
  while (stack.length) {
    const curr = stack.pop();

    if (refMap.hasRef(curr)) {
      retval += `__refs[${refMap.getRef(curr)}]`;
      continue;
    }

    if (curr instanceof Literal) {
      retval += curr.value;
    } else if (curr === null) {
      retval += 'null';
    } else if (curr === undefined) {
      retval += 'undefined';
    } else if (curr instanceof Date) {
      retval += `new Date(${curr.getTime()})`;
    } else if (typeof curr === 'string') {
      retval += `"${curr.replace(/"/g, '\\"')}"`;
    } else if (primitives.includes(typeof curr)) {
      retval += curr;
    } else if (typeof curr === 'symbol') {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=Symbol("${curr.description}")`;
    } else if (curr instanceof Array) {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=[`;
      stack.push(new Literal(']'));
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(new Literal(','));
        stack.push(curr[i]);
      }
    } else if (isSerializable(curr)) {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=`;
      stack.push(curr.ssr());
      // } else if (curr instanceof Call) {
      //   const func = curr.func;
      //   retval += `mod.${func.name}(`;
      //   stack.push(new Literal(')'));
      //   for (let len = curr.args.length, i = len - 1; i >= 0; i--) {
      //     stack.push(new Literal(','));
      //     stack.push(curr.args[i]);
      //   }
    } else if (curr instanceof Function) {
      stack.push(importDesc(curr, importMap));
    } else if (curr.constructor !== Object) {
      const ref = refMap.addRef(curr);
      retval += `(__refs[${ref}]={`;
      stack.push(new Literal(`},__refs[${ref}])`));
      stack.push(importDesc(curr.constructor, importMap));
      stack.push(new Literal(`__ctor:`));
      for (const k in curr) {
        const prop = curr[k];
        if (!(prop instanceof Function)) {
          stack.push(new Literal(','), prop, new Literal(`"${k}":`));
        }
      }
    } else {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]={`;
      stack.push(new Literal('}'));
      for (const k in curr) {
        const prop = curr[k];
        if (prop !== undefined)
          stack.push(new Literal(','), prop, new Literal(`"${k}":`));
      }
    }
  }

  return retval;
}

export class RefMap {
  ref: number = 0;
  map = new Map<any, number>();

  hasRef(o: any) {
    return this.map.has(o);
  }

  getRef(o: any) {
    return this.map.get(o);
  }

  addRef(o: any) {
    const ref = ++this.ref;
    this.map.set(o, ref);
    return ref;
  }
}

function isSerializable(obj: any): obj is Serializable {
  return obj && obj.ssr instanceof Function;
}

interface Serializable {
  ssr(): string;
}

function importDesc(value: any, importMap: ImportMap) {
  const { __src, __name, __args } = value as {
    __src: string;
    __name: string;
    __args: any;
  };

  if (!__src || !__name) {
    console.error('value has no import description', value);
    return null;
  }

  // const __ldr = importMap.add(`/closures/${__name}.js`);

  const __ldr = importMap.add(__src);

  if (!__src || !__name) {
    console.error('import descriptor of value is missing', value.toString());
    throw Error('import descriptor of value is missing');
  }

  return {
    __ldr: new Literal(__ldr),
    __name,
    __args,
  };
}

export class ImportMap {
  private _map = new Map<string, string>();
  add(source: string) {
    const id = contentHash('ld_', source, { start: 0, end: source.length });
    this._map.set(id, source);
    return id;
  }

  get entries() {
    return this._map;
  }
}
