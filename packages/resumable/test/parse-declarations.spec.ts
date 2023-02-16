'strict';

import { describe, expect, it } from 'vitest';
import { parse } from '../lib/transform/parse';

describe('parse declarations', () => {
  it('Initialize expression', () => {
    const code = `
      const a = new State();
    `;

    const [scope] = parse(code);

    expect(scope.mappings.get('a')).toBeDefined();

    const references = scope.mappings.get('a');
    expect(references).toHaveLength(1);
  });
});
