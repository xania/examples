'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('transform classes', () => {
  it('export class', () => {
    const code = `
      export class State {
      }

      export function App() {
        return new State();
      }
      `;
    const expected = `
      export class State {}
      __closure("State", State);

      export function App() {
        return new State();
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('export embedded class', () => {
    const code = `
      export function App() {
        class State {
        }
        return new State();
      }
      `;
    const expected = `
      export const Statewyjkw = __closure("Statewyjkw", class State {});
      export function App() {
        return new Statewyjkw();
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('export embedded class with trapped variables', () => {
    const code = `
      export function App() {
        const a = 1;
        class State {
          constructor() {
            console.log(a);
          }
        }
        return new State();
      }
      `;
    const expected = `
      export const Statecpdlo = (a) =>
        __closure(
          "Statecpdlo",
          class State {
            constructor() {
              console.log(a);
            }
          },
          [a]
        );
      export function App() {
        const a = 1;
      
        return new (Statecpdlo(a))();
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('export class constructor is not optimized', () => {
    const code = `
      export class State {
        constructor() {
          console.log(this);
        }
      }
    `;
    const expected = `
      export class State {
        constructor() {
          console.log(this);
        }
      }
      __closure("State", State);      
    `;
    assertTransform(code, expected);
  });

  it('export class member arrow', () => {
    const code = `
      export class State {
        arrow = () => {
          return this;
        }
      }
    `;
    const expected = `
      export const yikjuqullw = (this_36) =>
        __closure(
          "yikjuqullw",
          () => {
            return this_36;
          },
          [this_36]
        );
      export class State {
        arrow = yikjuqullw(this);
      }
      __closure("State", State);
    `;
    assertTransform(code, expected);
  });

  it('export class member method', () => {
    const code = `
      export class State {
        method() {
          return this;
        }
      }
    `;
    const expected = `
      export const vdkkvnuikr = __closure("vdkkvnuikr", function () {
        return this;
      });
      export class State {
        method = vdkkvnuikr;
      }
      __closure("State", State);
    `;
    assertTransform(code, expected);
  });

  it('export class member property', () => {
    const code = `
      export class State {
        get property() {
          return this;
        }
      }
    `;
    const expected = `
      export class State {
        get property() {
          return this;
        }
      }
      __closure("State", State);
    `;
    assertTransform(code, expected);
  });

  it('export class reference', () => {
    const code = `
      export class State {
      }

      function App() {
        return function Component() {
          return State;
        }
      }
    `;
    const expected = `
      export class State {}
      __closure("State", State);

      export const Compodbrtk = __closure("Compodbrtk", function Component() {
        return State;
      });
      export function App() {
        return Compodbrtk;
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('constructor defined property', () => {
    const code = `
      export class State {
        constructor() {
          this.arrow = () => {
            return this;
          };
        }
      }
    `;

    const expected = `
      export const muvrivprxw = (this_36) =>
        __closure("muvrivprxw", () => { return this_36; },
          [this_36]
        );
      export class State {
        constructor() {
          this.arrow = muvrivprxw(this);
        }
      }
      __closure("State", State);    
    `;

    assertTransform(code, expected);
  });

  it('embedded this reference', () => {
    const code = `
      export class JsxElement {
        setProp() {
          call(() => this);

          return this;
        }
      }
    `;

    const expected = `
      export const kxtxorhkkj = __closure("kxtxorhkkj", function () {
        call(vdvqpvxsrq(this));
      
        return this;
      });
      export const vdvqpvxsrq = (this_48) =>
        __closure("vdvqpvxsrq", () => this_48, [this_48]);
      export class JsxElement {
        setProp = kxtxorhkkj;
      }
      __closure("JsxElement", JsxElement);
      `;

    assertTransform(code, expected);
  });

  it('async method definition', () => {
    const code = `
        export class App {
          async method () {
          }
        }
      `;
    const expected = `
      export const nofovriccc = __closure("nofovriccc", async function () {});
      export class App {
        method = nofovriccc;
      }
      __closure("App", App);
    
  
    `;
    assertTransform(code, expected);
  });

  it('static method definition', () => {
    const code = `
        export class App {
          static method () {
          }
        }
      `;
    const expected = `
      export const mlepswnddd = __closure("mlepswnddd", function () {});
      export class App {
        static method = mlepswnddd;
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('static property definition', () => {
    const code = `
        export class App {
          static prop = function () {
          }
        }
      `;
    const expected = `
      export const dgigrduvem = __closure("dgigrduvem", function () {});
      export class App {
        static prop = dgigrduvem;
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });

  it('object property', () => {
    const code = `
        export const App = {
          async prop() {
          }
        }
      `;
    const expected = `
      export const ongnuqhbbb = __closure("ongnuqhbbb", async function () {});
      export const App = {
        prop: ongnuqhbbb,
      };
    
    `;
    assertTransform(code, expected);
  });
});
