'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('object expressions', () => {
  it('property arrow expression', () => {
    const code = `
      export const app = {
        arrow: () => {}
      }
      `;
    const expected = `
      export const $edvqpvyffl = __$("$edvqpvyffl", () => {});
      export const app = {
        arrow: $edvqpvyffl
      }
      `;
    assertTransform(code, expected);
  });

  it('property async arrow expression', () => {
    const code = `
      export const app = {
        arrow: async () => {}
      }
      `;
    const expected = `
      export const $nqwobvedvq = __$("$nqwobvedvq", async () => {});
      export const app = {
        arrow: $nqwobvedvq,
      };
      `;
    assertTransform(code, expected);
  });
});
