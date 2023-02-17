'strict';

import { describe, expect, it } from 'vitest';
import { parse } from '../lib/transform/parse';

describe('parse declarations', () => {
  it('declaration with an instance', () => {
    const code = `
      const a = new State(1, 2);
    `;

    const [scope] = parse(code);

    // expect(scope.mappings.get('a')).toBeDefined();

    // const expr = scope.mappings.get('a');
    // expect(expr).toBeInstanceOf(Instance);
    // if (expr instanceof Instance) {
    //   expect(expr.className).toBe('State');
    // }
  });
});
