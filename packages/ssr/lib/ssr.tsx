import { isRehydrateOperation, Literal, RehydrateType } from "@xania/view";

const primitives = ["number", "bigint", "boolean"];

export function serializeObject(obj: any) {
  let retval = "(function(__refs = {}){return ";

  const refMap = new RefMap();

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
      retval += "null";
    } else if (curr === undefined) {
      retval += "undefined";
    } else if (curr instanceof Date) {
      retval += `new Date(${curr.getTime()})`;
    } else if (typeof curr === "string") {
      retval += `"${curr.replace(/"/g, '\\"')}"`;
    } else if (primitives.includes(typeof curr)) {
      retval += curr;
    } else if (typeof curr === "symbol") {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=Symbol("${curr.description}")`;
    } else if (curr instanceof Array) {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=[`;
      stack.push(new Literal("]"));
      for (let i = curr.length - 1; i >= 0; i--) {
        stack.push(new Literal(","));
        stack.push(curr[i]);
      }
    } else if (isSerializable(curr)) {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]=`;
      stack.push(curr.ssr());
    } else if (isRehydrateOperation(curr)) {
      switch (curr.type) {
        case RehydrateType.Call:
          retval += `${curr.name}(`;
          stack.push(new Literal(")"));
          for (let len = curr.args.length, i = len - 1; i >= 0; i--) {
            stack.push(new Literal(","));
            stack.push(curr.args[i]);
          }
          break;
        // case RehydrateType.Construct:
        //   retval += `Object.assign(${curr.target}, `;
        //   stack.push(new Literal(")"));
        //   stack.push(curr.source);
        //   break;
      }
    } else if (curr instanceof Function) {
      retval += `()=>console.log('"${curr.name.replace(/"/g, '\\"')}"')`;
    } else if (curr.constructor !== Object) {
      const ref = refMap.addRef(curr);

      // Reflect.setPrototypeOf(data, JsxElement.prototype)
      retval += `(Reflect.setPrototypeOf(__refs[${ref}]={`;
      stack.push(
        new Literal(`}, ${curr.constructor.name}.prototype),__refs[${ref}])`)
      );
      for (const k in curr) {
        const prop = curr[k];
        if (!(prop instanceof Function)) {
          stack.push(new Literal(","), prop, new Literal(`"${k}":`));
        }
      }
    } else {
      const ref = refMap.addRef(curr);
      retval += `__refs[${ref}]={`;
      stack.push(new Literal("}"));
      for (const k in curr) {
        const prop = curr[k];
        stack.push(new Literal(","), prop, new Literal(`"${k}":`));
      }
    }
  }

  retval += "})({})";
  return retval;
}

export const ValueType = {
  Symbol: 1,
} as const;

class RefMap {
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

interface Serializable {
  ssr(): string;
}

function isSerializable(obj: any): obj is Serializable {
  return obj && obj.ssr instanceof Function;
}
