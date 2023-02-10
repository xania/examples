'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('export declarations', () => {
  it('export and flag top level functions', () => {
    const code = `
      function App() {
        return "Hello App";
      }
    `;
    const expected = `
      export function App() {
        return "Hello App";
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('async functions', () => {
    const code = `
      async function App() {
        return "Hello App";
      }
    `;
    const expected = `
      export async function App() {
        return "Hello App";
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('flag top level function', () => {
    const code = `
      export function App() {
        return "Hello App";
      }
    `;
    const expected = `
      export function App() {
        return "Hello App";
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('flag default function', () => {
    const code = `
      export default function App() {
        return "Hello App";
      }
    `;
    const expected = `
      const App = __closure("App", function App() {
        return "Hello App";
      });
      export default App;
    `;
    assertTransform(code, expected);
  });

  it('flag default anonymous function', () => {
    const code = `
      export default function () {
        return "Hello Anonymous";
      }
    `;
    const expected = `
      const ssfjqgfkln = __closure("ssfjqgfkln", function () {
        return "Hello Anonymous";
      });
      export default ssfjqgfkln;
    `;
    assertTransform(code, expected);
  });

  it('local function', () => {
    const code = `
      export function App() {
        return function Component() {
        }
      }
    `;
    const expected = `
      export const Compodfldr = __closure("Compodfldr", function Component() {});
      export function App() {
        return Compodfldr;
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });
  it('local async function', () => {
    const code = `
      export function App() {
        async function Component() {
        }

        return Component;
      }
    `;
    const expected = `
      export const Compochsbg = __closure(
        "Compochsbg",
        async function Component() {}
      );
      export function App() {
        return Compochsbg;
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('local function with trapped variables', () => {
    const code = `
      export function App() {
        const a = 1
        function Component() {
          return a;
        }
        return Component();
      }
    `;
    const expected = `
      export const Compoexfaq = (a) =>
        __closure("Compoexfaq", function Component() {
            return a;
          }, [a]
        );
      export function App() {
        const a = 1;

        return Compoexfaq(a)();
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('local function with trapped params', () => {
    const code = `
      export function App(a = 1) {
        return function Component() {
          return a;
        }
      }
    `;
    const expected = `
      export const Compowyekn = (a) =>
        __closure("Compowyekn", function Component() {
            return a;
          }, [a]
        );
      export function App(a = 1) {
        return Compowyekn(a);
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('local function with unresolved variables', () => {
    const code = `
      export function App() {
        return function Component() {
          return a;
        }
      }
    `;
    const expected = `
      export const Compoqechi = __closure("Compoqechi", function Component() {
        return a;
      });
      export function App() {
        return Compoqechi;
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('local function expression', () => {
    const code = `
      export function App() {
        const a = 1;
        return function () {
          return a;
        }
      }
    `;
    const expected = `
      export const ekbfkukmqv = (a) =>
        __closure("ekbfkukmqv", function () { return a; }, [a] );
      export function App() {
        const a = 1;
        return ekbfkukmqv(a);
      }
      __closure("App", App);`;
    assertTransform(code, expected);
  });

  it('local function params', () => {
    const code = `
      export function App() {
        const a = 1;
        return function(a) {
          return a;
        }
      }
    `;

    const expect = `
      export const ekbfkukmik = __closure("ekbfkukmik", function (a) {
        return a;
      });
      export function App() {
        const a = 1;
        return ekbfkukmik;
      }
      __closure("App", App);
    `;

    assertTransform(code, expect);
  });

  it('export property method', () => {
    const code = `
      export const App = {
        createELement() {}
      }
    `;

    const expect = `
      export const tscsulffff = __closure("tscsulffff", function () {});
      export const App = {
        createELement: tscsulffff,
      };
    `;

    assertTransform(code, expect);
  });

  it('export async property method', () => {
    const code = `
      export const App = {
        async createELement() {}
      }
    `;

    const expect = `
      export const qriussyyyy = __closure("qriussyyyy", async function () {});
      export const App = {
        createELement: qriussyyyy,
      };
    `;

    assertTransform(code, expect);
  });

  it('nested property method', () => {
    const code = `
    export function App() {
      return compile().then(result => {
        return {
          dispose() {
            // dispose
          },
        };
      })
    }
    `;

    const expected = `
      export const uodtyghxmi = __closure("uodtyghxmi", (result) => {
        return {
          dispose: ymcmycrwbw,
        };
      });
      export const ymcmycrwbw = __closure("ymcmycrwbw", function () {
        // dispose
      });
      export function App() {
        return compile().then(uodtyghxmi);
      }
      __closure("App", App);
      `;

    assertTransform(code, expected);
  });

  it('delay', () => {
    const code = `
      export function App(value, ts = 1000) {
        return new Promise((resolve, reject) => {
          setTimeout(function () {
            resolve(value);
          }, ts);
        })
      }
    `;

    const expected = `
      export const mgwbwxdhnh = (value, ts) =>
        __closure("mgwbwxdhnh", (resolve, reject) => {
            setTimeout(weemnbmmcf(resolve, value), ts);
          }, [value, ts] );
      export const weemnbmmcf = (resolve, value) =>
        __closure("weemnbmmcf", function () {
          resolve(value);
        }, [resolve, value] );
      export function App(value, ts = 1000) {
        return new Promise(mgwbwxdhnh(value, ts));
      }
      __closure("App", App);
    `;

    assertTransform(code, expected);
  });

  it('local function reference', () => {
    const code = `
      export function App(a) {
        function handler() {
          console.log(a);
        }

        return { a: handler };
      }
    `;

    const expected = `
      export const handlcybng = (a) =>
        __closure("handlcybng",function handler() {
            console.log(a);
          }, [a]
        );
      export function App(a) {
        return { a: handlcybng(a) };
      }
      __closure("App", App);
    `;

    assertTransform(code, expected);
  });

  it('export default function declaration', () => {
    const code = `
      export default function App() {
        return function Component() {}
      }
    `;

    const expected = `
      const App = __closure("App", function App() {
        return Compoomooc;
      });
      export const Compoomooc = __closure("Compoomooc", function Component() {});
      export default App;
    `;
    assertTransform(code, expected);
  });

  it('closure over root variable declaration', () => {
    const code = `
      const jsx = null;
      export default function App() {
        return function Component() {
          return jsx;
        }
      }
    `;

    const expected = `
      const App = __closure("App", function App() {
        return Compoqluqm;
      });
      const jsx = null;
      export const Compoqluqm = __closure("Compoqluqm", function Component() {
        return jsx;
      });
      export default App;
    `;
    assertTransform(code, expected);
  });
});
