export function contentHash(
  baseName: string,
  str: string,
  range: { start: number; end: number },
  fill: number = '_'.charCodeAt(0)
) {
  const { start, end } = range;
  const maxLen = 10 - baseName.length;
  const bits = new Int8Array({ length: maxLen }).fill(
    (Math.abs(fill - 97) % (122 - 97)) + 97
  );
  for (let i = 0, len = end - start + 1; i < len; i++) {
    const u = i % maxLen;
    const c = str.charCodeAt(i + start) ^ bits[u];

    bits[u] = (Math.abs(c - 97) % (122 - 97)) + 97;
  }

  const retval = String.fromCharCode(...bits);

  return baseName + retval;
}
