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
      export const Stategsseu = __closure("Stategsseu", class State {});
      export function App() {
        return new Stategsseu();
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
      export const Stateiadeo = (a) =>
        __closure(
          "Stateiadeo",
          class State {
            constructor() {
              console.log(a);
            }
          },
          [a]
        );
      export function App() {
        const a = 1;
      
        return new (Stateiadeo(a))();
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
      export const xjhiabkoul = (this_36) =>
        __closure(
          "xjhiabkoul",
          () => {
            return this_36;
          },
          [this_36]
        );
      export class State {
        arrow = xjhiabkoul(this);
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
      export const kodrqgryhc = (this_36) =>
        __closure( "kodrqgryhc", function () {
            return this_36;
          }, [this_36]
        );
      export class State {
        method = kodrqgryhc(this);
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
      export const Compocojui = __closure("Compocojui", function Component() {
        return State;
      });
      export class State {}
      __closure("State", State);
      
      export function App() {
        return Compocojui;
      }
      __closure("App", App);
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
      export const Compocojui = __closure("Compocojui", function Component() {
        return State;
      });
      export class State {}
      __closure("State", State);
      
      export function App() {
        return Compocojui;
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
      export const bldklkwcqp = (this_36) =>
        __closure("bldklkwcqp", () => { return this_36; },
          [this_36]
        );
      export class State {
        constructor() {
          this.arrow = bldklkwcqp(this);
        }
      }
      __closure("State", State);    
    `;

    assertTransform(code, expected);
  });
});
