'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('client scripts', () => {
  it('clear all imports and exports', () => {
    const code = `
    import * as lib from "./library.ts";
    export * from "./view.tsx";
    `;
    const expected = ``;
    assertTransform(code, expected, { ssr: false });
  });

  it('remove unused even the exported ones', () => {
    const code = `
    function Unused() {
    }
    export function App() {
    }
    `;
    const expected = ``;
    assertTransform(code, expected, { ssr: false });
  });

  it('preserve used Component', () => {
    const code = `
    function Component() {
    }
    export function App() {
      return Component();
    }
    `;
    const expected = `
      export function Component() {}
      __closure("Component", Component);
    `;
    assertTransform(code, expected, { ssr: false });
  });

  it('preserve used local Component', () => {
    const code = `
    export function App() {
      function Component() {
          function Bla() {
          }
      }
      return Component();
    }
    `;
    const expected = `
    export const Compogsbnm = __closure("Compogsbnm", function Component() {});
    `;
    assertTransform(code, expected, { ssr: false });
  });

  it('preserve used property method but not the property itself', () => {
    const code = `
    export function App() {
      return { 
        property() {
          return 1;
        }
      }
    }
    `;
    const expected = `
    export const ixyngnfpon = __closure("ixyngnfpon", function () {
      return 1;
    });
    `;
    assertTransform(code, expected, { ssr: false });
  });
});
