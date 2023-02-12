export async function hydrate(obj: any, hydrationRoot: Node) {
  const result: { root?: any } = {};

  const stack = [[result as any, 'root' as string, obj] as const];
  while (stack.length) {
    const [t, p, src] = stack.pop()!;
    if (src === null || src === undefined) {
      t[p] = src;
    } else if (typeof src === 'object') {
      if (src instanceof Array) {
        const c = [] as const;
        t[p] = c;
        for (const k in src) {
          stack.push([c, k, src[k]]);
        }
      } else if ('__ctor' in src) {
        const ctor = src.__ctor;
        const loader = ctor.__ldr as () => Promise<Record<string, any>>;
        const instance = await loader().then((mod) => new mod[ctor.__name]());
        t[p] = instance;
        for (const k in src) {
          stack.push([instance, k, src[k]]);
        }
      } else if ('__ldr' in src) {
        const loader = src['__ldr'] as () => Promise<Record<string, any>>;
        t[p] = await loader().then((m) => m[src.__name]);
      } else if ('__node' in src) {
        const path = src.__node;
        let node = hydrationRoot;
        for (let i = 0, len = path.length; i < len; i++) {
          node = node.childNodes[path[i]];
        }
        t[p] = node;
      } else {
        const c = {};
        t[p] = c;
        for (const k in src) {
          stack.push([c, k, src[k]]);
        }
      }
    } else {
      t[p] = src;
    }
  }
  return result.root;
}
