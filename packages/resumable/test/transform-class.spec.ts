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
      export const State$qeyou = __$("State$qeyou", class State {});
      export const State = State$qeyou;
      
      export const App$fkuxmnc = (State) =>
        __$(
          "App$fkuxmnc",
          function App() {
            return new State();
          },
          [State]
        );
      export const App = App$fkuxmnc(State$qeyou);
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
      export const App$bloxyvh = (State$wyjkw) =>
        __$(
          "App$bloxyvh",
          function App() {
            return new State$wyjkw();
          },
          [State$wyjkw]
        );
      export const State$wyjkw = __$("State$wyjkw", class State {});
      export const App = App$bloxyvh(State$wyjkw);
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
      export const App$jqronbf = (State$cpdlo) =>
        __$(
          "App$jqronbf",
          function App() {
            const a = 1;
      
            return new (State$cpdlo(a))();
          },
          [State$cpdlo]
        );
      export const State$cpdlo = (a) =>
        __$(
          "State$cpdlo",
          class State {
            constructor() {
              console.log(a);
            }
          },
          [a]
        );
      export const App = App$jqronbf(State$cpdlo);
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
      export const State$pvvqe = __$(
        "State$pvvqe",
        class State {
          constructor() {
            console.log(this);
          }
        }
      );
      export const State = State$pvvqe;  
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
      export const State$cijbj = ($yikjuqullw) =>
        __$(
          "State$cijbj",
          class State {
            arrow = $yikjuqullw(this);
          },
          [$yikjuqullw]
        );
      export const $yikjuqullw = (this_36) =>
        __$(
          "$yikjuqullw",
          () => {
            return this_36;
          },
          [this_36]
        );
      export const State = State$cijbj($yikjuqullw);
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
      export const State$eurgi = ($vdkkvnuikr) =>
        __$(
          "State$eurgi",
          class State {
            method = $vdkkvnuikr;
          },
          [$vdkkvnuikr]
        );
      export const $vdkkvnuikr = __$("$vdkkvnuikr", function () {
        return this;
      });
      export const State = State$eurgi($vdkkvnuikr);
    `;
    assertTransform(code, expected);
  });

  it('export class get property', () => {
    const code = `
      export class State {
        get property() {
          return this;
        }
      }
    `;
    const expected = `
      export const State$cuurb = __$(
        "State$cuurb",
        class State {
          get property() {
            return this;
          }
        }
      );
      export const State = State$cuurb;
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
      export const State$qeyou = __$("State$qeyou", class State {});
      export const State = State$qeyou;
      
      export const Compo$dbrtk = (State) =>
        __$(
          "Compo$dbrtk",
          function Component() {
            return State;
          },
          [State]
        );
      export const App$saxjqbc = (Compo$dbrtk) =>
        __$(
          "App$saxjqbc",
          function App() {
            return Compo$dbrtk(State$qeyou);
          },
          [Compo$dbrtk]
        );
    
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
      export const State$gfoml = ($muvrivprxw) =>
        __$(
          "State$gfoml",
          class State {
            constructor() {
              this.arrow = $muvrivprxw(this);
            }
          },
          [$muvrivprxw]
        );
      export const $muvrivprxw = (this_62) =>
        __$(
          "$muvrivprxw",
          () => {
            return this_62;
          },
          [this_62]
        );
      export const State = State$gfoml($muvrivprxw);
    `;

    assertTransform(code, expected);
  });

  it('embedded this reference', () => {
    const code = `
      export class JsxElement {
        setProp() {
          call(() => [this]);

          return this;
        }
      }
    `;

    const expected = `
      export const JsxEl$bifgf = ($chkkxupfxh, $apcqpvrxsr) =>
        __$(
          "JsxEl$bifgf",
          class JsxElement {
            setProp = $chkkxupfxh($apcqpvrxsr);
          },
          [$chkkxupfxh, $apcqpvrxsr]
        );
      export const $chkkxupfxh = ($apcqpvrxsr) =>
        __$(
          "$chkkxupfxh",
          function () {
            call($apcqpvrxsr(this));
      
            return this;
          },
          [$apcqpvrxsr]
        );
      export const $apcqpvrxsr = (this_63) =>
        __$("$apcqpvrxsr", () => [this_63], [this_63]);
      export const JsxElement = JsxEl$bifgf($chkkxupfxh, $apcqpvrxsr);
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
      export const App$fpfbanx = ($nofovriccc) =>
        __$(
          "App$fpfbanx",
          class App {
            method = $nofovriccc;
          },
          [$nofovriccc]
        );
      export const $nofovriccc = __$("$nofovriccc", async function () {});
      export const App = App$fpfbanx($nofovriccc);
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
      export const App$naxpyxf = ($mlepswnddd) =>
        __$(
          "App$naxpyxf",
          class App {
            static method = $mlepswnddd;
          },
          [$mlepswnddd]
        );
      export const $mlepswnddd = __$("$mlepswnddd", function () {});
      export const App = App$naxpyxf($mlepswnddd);
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
      export const App$abyijko = ($feqseystgo) =>
        __$(
          "App$abyijko",
          class App {
            static prop = $feqseystgo;
          },
          [$feqseystgo]
        );
      export const $feqseystgo = __$("$feqseystgo", function () {});
      export const App = App$abyijko($feqseystgo);
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
      export const $ayixiyyyyy = __$("$ayixiyyyyy", async function () {});
      export const App = {
        prop: $ayixiyyyyy,
      };
    `;
    assertTransform(code, expected);
  });
});
