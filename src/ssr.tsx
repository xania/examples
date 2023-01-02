const primitives = ["string", "number", "bigint", "boolean"];

export function serializeObject(obj: any, refMap = new RefMap()) {
  if (obj === null) return "null";

  if (obj === undefined) {
    return "undefined";
  }

  if (obj instanceof Array) {
    return "[" + obj.map((o) => serializeObject(o, refMap)).join(",") + "]";
  }

  if (obj instanceof Date) {
    return obj.toUTCString();
  }

  if (obj instanceof Function) {
    throw Error("don't know how to serialize functions: " + obj);
  }

  if (typeof obj === "string") return `"${obj.replace(/"/g, '\\"')}"`;

  if (primitives.includes(typeof obj)) return obj;

  if (typeof obj === "symbol") {
    const ref = refMap.getRef(obj);
    return `refs.resolve(${ref}, Symbol, "${obj.description}")`;
    // return JSON.stringify({ type: ValueType.Symbol, ref: refMap.getRef(obj) });
  }

  if (isSerializable(obj)) {
    return serializeObject(obj.ssr());
  }

  let retval = "{";

  for (const k in obj) {
    if (!(obj[k] instanceof Function))
      retval += `"${k}"` + ":" + serializeObject(obj[k], refMap) + ",";
  }
  retval += "}";

  return retval;
}

export const ValueType = {
  Symbol: 1,
} as const;

class RefMap {
  ref: number = 0;
  map = new Map<any, number>();

  getRef(o: any) {
    if (this.map.has(o)) {
      return this.map.get(o);
    }
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
