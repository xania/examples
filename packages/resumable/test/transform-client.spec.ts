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

  it('class property initialization', () => {
    const code = `
        export class App {
          arrow = () => {
            return [this, a]
          }

          method() {
            return [this, a]
          }     
        }
      `;
    const expected = `
      export const vgldvdaynm = __closure("vgldvdaynm", function () {
        return [this, a];
      });
      export const andtchufbn = (this_38) =>
        __closure( "andtchufbn", () => {
            return [this_38, a];
          },
          [this_38]
        );
    
  
    `;
    assertTransform(code, expected, { ssr: false });
  });
  it('regression', () => {
    const code = `
    var c;
    ((s) => {
      ((t) => {
        t[t.Map = 0] = "Map", t[t.Bind = 1] = "Bind", t[t.Connect = 2] = "Connect", t[t.Property = 3] = "Property", t[t.Merge = 4] = "Merge";
      })(s.StateOperatorType || (s.StateOperatorType = {}));
    })(c || (c = {}));
    `;
    const expected = `
    ;export const ljfgtgudgw = __closure("ljfgtgudgw", (s) => {
      (bsavvoloii)(s.StateOperatorType || (s.StateOperatorType = {}));
    });export const bsavvoloii = __closure("bsavvoloii", (t) => {
        t[t.Map = 0] = "Map", t[t.Bind = 1] = "Bind", t[t.Connect = 2] = "Connect", t[t.Property = 3] = "Property", t[t.Merge = 4] = "Merge";
      });var c;
    ()(c || (c = {}));
    `;
    assertTransform(code, expected, { ssr: false });
  });
});
