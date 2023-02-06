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
      const eacqwfarqk = __closure("eacqwfarqk", function () {
        return "Hello Anonymous";
      });
      export default eacqwfarqk;
    `;
    assertTransform(code, expected);
  });

  it('local function', () => {
    const code = `
      export function App() {
        function Component() {
        }
      }
    `;
    const expected = `
      export const Compodfldr = __closure("Compodfldr", function Component() {});
      export function App() {}
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
      export const Compoqfmby = __closure(
        "Compoqfmby",
        async function Component() {}
      );
      export function App() {
        return Compoqfmby;
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
      export const Compoeeivq = (a) =>
        __closure("Compoeeivq", function Component() {
            return a;
          }, [a]
        );
      export function App() {
        const a = 1;

        return Compoeeivq(a)();
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
      export const Composecnx = (a) =>
        __closure("Composecnx", function Component() {
            return a;
          }, [a]
        );
      export function App(a = 1) {
        return Composecnx(a);
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
      export const Compoqdcjl = __closure("Compoqdcjl", function Component() {
        return a;
      });
      export function App() {
        return Compoqdcjl;
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
      export const epxhhokqfk = (a) =>
        __closure("epxhhokqfk", function () { return a; }, [a] );
      export function App() {
        const a = 1;
        return epxhhokqfk(a);
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
      export const epxhhokqnn = __closure("epxhhokqnn", function (a) {
        return a;
      });
      export function App() {
        const a = 1;
        return epxhhokqnn;
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
      export const rqjtrrxxxx = __closure("rqjtrrxxxx", function () {});
      export const App = {
        createELement: rqjtrrxxxx,
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
      export const hgpnhxrrrr = __closure("hgpnhxrrrr", async function () {});
      export const App = {
        createELement: hgpnhxrrrr,
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
      export const qqctercehn = __closure("qqctercehn", (result) => {
        return {
          dispose: vrfplfmcgt,
        };
      });
      export const vrfplfmcgt = __closure("vrfplfmcgt", function () {
        // dispose
      });
      export function App() {
        return compile().then(qqctercehn);
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
      export const jmsilawerk = (value, ts) =>
        __closure("jmsilawerk", (resolve, reject) => {
            setTimeout(ncldnbmoid(resolve, value), ts);
          }, [value, ts] );
      export const ncldnbmoid = (resolve, value) =>
        __closure("ncldnbmoid", function () {
          resolve(value);
        }, [resolve, value] );
      export function App(value, ts = 1000) {
        return new Promise(jmsilawerk(value, ts));
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
      export const handlfegqf = (a) =>
        __closure("handlfegqf",function handler() {
            console.log(a);
          }, [a]
        );
      export function App(a) {
        return { a: handlfegqf(a) };
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
        return Compocmmmq;
      });
      export const Compocmmmq = __closure("Compocmmmq", function Component() {});
      export default App;
    `;
    assertTransform(code, expected);
  });
});
