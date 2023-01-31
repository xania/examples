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
      const evclwfvrqk = __closure("evclwfvrqk", function () {
        return "Hello Anonymous";
      });
      export default evclwfvrqk;
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
      export const Compodrlee = __closure("Compodrlee", function Component() {});
      export function App() {
        const Component = Compodrlee;
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
      }
    `;
    const expected = `
      export const Compohirlh = __closure("Compohirlh", async function Component() {});
      export function App() {
        const Component = Compohirlh;
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
      }
    `;
    const expected = `
      export const Compobeevi = (a) => __closure(
        "Compobeevi",
          function Component() {
            return a;
          },
        [a]
      );
      export function App() {
        const a = 1;
        const Component = Compobeevi(a);
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('local function with trapped params', () => {
    const code = `
      export function App(a = 1) {
        function Component() {
          return a;
        }
      }
    `;
    const expected = `
      export const Compocyfor = (a) => __closure(
        "Compocyfor",
          function Component() {
            return a;
          },
        [a]
      );
      export function App(a = 1) {
        const Component = Compocyfor(a);
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('local function with unresolved variables', () => {
    const code = `
      export function App() {
        function Component() {
          return a;
        }
      }
    `;
    const expected = `
      export const Compoqycyk = __closure("Compoqycyk", function Component() {
        return a;
      });
      export function App() {
        const Component = Compoqycyk;
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
      const bdkhmqcefk = (a) =>
        __closure("bdkhmqcefk", function () { return a; }, [a] );
      export function App() {
        const a = 1;
        return bdkhmqcefk(a);
      }
      __closure("App", App);`;
    assertTransform(code, expected);
  });

  it('local function params', () => {
    const code = `
      export function view() {
        const a = 1;
        return function(a) {
          return a;
        }
      }
    `;

    const expect = `
      const gkdfmnbhok = __closure("gkdfmnbhok", function (a) {
        return a;
      });
      export function view() {
        const a = 1;
        return gkdfmnbhok;
      }
      __closure("view", view);
    `;

    assertTransform(code, expect);
  });

  it('export property method', () => {
    const code = `
      export const prop = {
        createELement() {}
      }
    `;

    const expect = `
      export const vueysq2222 = __closure("vueysq2222", function () {});
      export const prop = {
        createELement: vueysq2222,
      };
    `;

    assertTransform(code, expect);
  });

  it('export async property method', () => {
    const code = `
      export const prop = {
        async createELement() {}
      }
    `;

    const expect = `
      export const gfxfdw8888 = __closure("gfxfdw8888", async function () {});
      export const prop = {
        createELement: gfxfdw8888,
      };
    `;

    assertTransform(code, expect);
  });

  it('nested property method', () => {
    const code = `
    export function render() {
      return compile().then(result => {
        return {
          dispose() {
            // dispose
          },
        };
      })
    }
    export function lazy() {
      return "Hello lazy";
    }
    `;

    const expected = `
      const pqhvggfmcp = __closure("pqhvggfmcp", (result) => {
        return {
          dispose: qukeskahmn,
        };
      });
      export const qukeskahmn = __closure("qukeskahmn", function () {
        // dispose
      });
      export function render() {
        return compile().then(pqhvggfmcp);
      }
      __closure("render", render);
      export function lazy() {
        return "Hello lazy";
      }
      __closure("lazy", lazy);
      `;

    assertTransform(code, expected);
  });

  it('delay', () => {
    const code = `
      export function delay(value, ts = 1000) {
        return new Promise((resolve, reject) => {
          setTimeout(function () {
            resolve(value);
          }, ts);
        })
      }
    `;

    const expected = `
      const kogcvckfyp = (value, ts) =>
        __closure("kogcvckfyp", (resolve, reject) => {
            setTimeout(rdnborkqtx(resolve, value), ts);
          }, [value, ts] );
      const rdnborkqtx = (resolve, value) =>
        __closure("rdnborkqtx", function () {
            resolve(value);
          }, [resolve, value] );
      export function delay(value, ts = 1000) {
        return new Promise(kogcvckfyp(value, ts));
      }
      __closure("delay", delay);
    `;

    assertTransform(code, expected);
  });

  it('reference local function', () => {
    const code = `
      export function view(a) {
        function handler() {
          console.log(a);
        }

        return { a: handler };
      }
    `;

    const expected = `
      const kogcvckfyp = (value, ts) =>
        __closure("kogcvckfyp", (resolve, reject) => {
            setTimeout(rdnborkqtx(resolve, value), ts);
          }, [value, ts] );
      const rdnborkqtx = (resolve, value) =>
        __closure("rdnborkqtx", function () {
            resolve(value);
          }, [resolve, value] );
      export function delay(value, ts = 1000) {
        return new Promise(kogcvckfyp(value, ts));
      }
      __closure("delay", delay);
    `;

    assertTransform(code, expected);
  });
});
