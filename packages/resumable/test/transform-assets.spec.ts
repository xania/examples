'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('module assets', () => {
  it('import statement includes assets', () => {
    const code = `
      import * as lib from "./library";
    `;
    const expected = `
    import * as lib from "./library?resume";
    `;
    assertTransform(code, expected);
  });
});
