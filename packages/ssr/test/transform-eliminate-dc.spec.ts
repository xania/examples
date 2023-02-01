'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('eliminate dead code', () => {
  it('unused ', () => {
    const code = `
      function UnusedComponent() {
      }
      export function App() {
      }
      `;
    const expected = `
      export function App() {
      }
      __closure("App", App);
        `;
    assertTransform(code, expected);
  });
});
