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
      const pgrijomloh = __closure("pgrijomloh", function () {
        return "Hello Anonymous";
      });
      export default pgrijomloh;
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
      export const qsemvhiwnd = __closure("qsemvhiwnd", function Component() {});
      export function App() {
        const Component = qsemvhiwnd;
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
      export const qangdbqsem = __closure("qangdbqsem", async function Component() {});
      export function App() {
        const Component = qangdbqsem;
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
      export const bjnqennpkd = (a) => __closure(
        "bjnqennpkd",
          function Component() {
            return a;
          },
        [a]
      );
      export function App() {
        const a = 1;
        const Component = bjnqennpkd(a);
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('local function with trapped params', () => {
    const code = `
      export function App(a) {
        function Component() {
          return a;
        }
      }
    `;
    const expected = `
      export const bjnqennpkd = (a) => __closure(
        "bjnqennpkd",
          function Component() {
            return a;
          },
        [a]
      );
      export function App(a) {
        const Component = bjnqennpkd(a);
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
      export const bjnqennpkd = __closure("bjnqennpkd", function Component() {
        return a;
      });
      export function App() {
        const Component = bjnqennpkd;
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
      const yrghhuoqcp = (a) =>
        __closure("yrghhuoqcp", function () { return a; }, [a] );
      export function App() {
        const a = 1;
        return yrghhuoqcp(a);
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
      const yrghhuoqkk = __closure("yrghhuoqkk", function (a) {
        return a;
      });
      export function view() {
        const a = 1;
        return yrghhuoqkk;
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
      export const ictgesyxfw = __closure("ictgesyxfw", function () {});
      export const prop = {
        createELement: ictgesyxfw,
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
      export const qjrautictg = __closure("qjrautictg", async function () {});
      export const prop = {
        createELement: qjrautictg,
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
      export const bgpxhhyxca = __closure("bgpxhhyxca", function () {
        // dispose
      });
      export const thtvblkpur = __closure("thtvblkpur", function lazy() {
        return "Hello lazy";
      })  
      export function render() {
        return compile().then(result => {
          return {
            dispose:bgpxhhyxca,
          };
        })
      }
      __closure("render", render);
      export const lazy = thtvblkpur;
    `;

    assertTransform(code, expected);
  });
});
