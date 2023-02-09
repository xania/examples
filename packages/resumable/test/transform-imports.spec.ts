'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('module assets', () => {
  it('import statement includes assets', () => {
    const code = `
    import * as lib from "./library.ts";
    export * from "./view.tsx";
    `;
    const expected = `
    import * as lib from "./library.resume.ts";
    export * from "./view.resume.tsx";
    `;
    assertTransform(code, expected);
  });
});
