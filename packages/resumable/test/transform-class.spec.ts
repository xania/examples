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
      export function State$qeyou() {
        return __$("State$qeyou", class State {});
      }
      export const State = State$qeyou();
      
      export function App$fkuxmnc(State$qeyou) {
        return __$(
          "App$fkuxmnc",
          function App() {
            return new (State$qeyou())();
          },
          [State$qeyou]
        );
      }
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
      export function App$bloxyvh(State$wyjkw) {
        return __$(
          "App$bloxyvh",
          function App() {
            return new (State$wyjkw())();
          },
          [State$wyjkw]
        );
      }
      export function State$wyjkw() {
        return __$("State$wyjkw", class State {});
      }
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
      export function App$jqronbf(State$cpdlo) {
        return __$(
          "App$jqronbf",
          function App() {
            const a = 1;
      
            return new (State$cpdlo(a))();
          },
          [State$cpdlo]
        );
      }
      export function State$cpdlo(a) {
        return __$(
          "State$cpdlo",
          class State {
            constructor() {
              console.log(a);
            }
          },
          [a]
        );
      }
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
      export function State$pvvqe() {
        return __$(
          "State$pvvqe",
          class State {
            constructor() {
              console.log(this);
            }
          }
        );
      }
      export const State = State$pvvqe();
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
      export function State$cijbj($yikjuqullw) {
        return __$(
          "State$cijbj",
          class State {
            arrow = $yikjuqullw(this);
          },
          [$yikjuqullw]
        );
      }
      export function $yikjuqullw(this_44) {
        return __$(
          "$yikjuqullw",
          () => {
            return this_44;
          },
          [this_44]
        );
      }
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
      export function State$eurgi($vdkkvnuikr) {
        return __$(
          "State$eurgi",
          class State {
            method = $vdkkvnuikr();
          },
          [$vdkkvnuikr]
        );
      }
      export function $vdkkvnuikr() {
        return __$("$vdkkvnuikr", function () {
          return this;
        });
      }
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
      export function State$cuurb() {
        return __$(
          "State$cuurb",
          class State {
            get property() {
              return this;
            }
          }
        );
      }
      export const State = State$cuurb();
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
      export function State$qeyou() {
        return __$("State$qeyou", class State {});
      }
      export const State = State$qeyou();
      
      export function Compo$dbrtk(State$qeyou) {
        return __$(
          "Compo$dbrtk",
          function Component() {
            return State$qeyou();
          },
          [State$qeyou]
        );
      }
      export function App$saxjqbc(State$qeyou, Compo$dbrtk) {
        return __$(
          "App$saxjqbc",
          function App() {
            return Compo$dbrtk(State$qeyou);
          },
          [State$qeyou, Compo$dbrtk]
        );
      } 
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
      export function State$gfoml($muvrivprxw) {
        return __$(
          "State$gfoml",
          class State {
            constructor() {
              this.arrow = $muvrivprxw(this);
            }
          },
          [$muvrivprxw]
        );
      }
      export function $muvrivprxw(this_75) {
        return __$(
          "$muvrivprxw",
          () => {
            return this_75;
          },
          [this_75]
        );
      }
      export const State = State$gfoml($muvrivprxw);
    `;

    assertTransform(code, expected);
  });

  it('embedded this reference', () => {
    const code = `
      export class JsxElement {
        setProp() {
          call(() => (this));

          return this;
        }
      }
    `;

    const expected = `
      export function JsxEl$cifgf($aucqpvexsr, $cpkkxugfxh) {
        return __$(
          "JsxEl$cifgf",
          class JsxElement {
            setProp = $cpkkxugfxh($aucqpvexsr);
          },
          [$aucqpvexsr, $cpkkxugfxh]
        );
      }
      export function $cpkkxugfxh($aucqpvexsr) {
        return __$(
          "$cpkkxugfxh",
          function () {
            call($aucqpvexsr(this));
      
            return this;
          },
          [$aucqpvexsr]
        );
      }
      export function $aucqpvexsr(this_68) {
        return __$("$aucqpvexsr", () => this_68, [this_68]);
      }
      export const JsxElement = JsxEl$cifgf($aucqpvexsr, $cpkkxugfxh);
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
      export function App$fpfbanx($nofovriccc) {
        return __$(
          "App$fpfbanx",
          class App {
            method = $nofovriccc();
          },
          [$nofovriccc]
        );
      }
      export function $nofovriccc() {
        return __$("$nofovriccc", async function () {});
      }
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
      export function App$naxpyxf($mlepswnddd) {
        return __$(
          "App$naxpyxf",
          class App {
            static method = $mlepswnddd();
          },
          [$mlepswnddd]
        );
      }
      export function $mlepswnddd() {
        return __$("$mlepswnddd", function () {});
      }
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
      export function App$abyijko($feqseystgo) {
        return __$(
          "App$abyijko",
          class App {
            static prop = $feqseystgo();
          },
          [$feqseystgo]
        );
      }
      export function $feqseystgo() {
        return __$("$feqseystgo", function () {});
      }
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
      export function $ayixiyyyyy() {
        return __$("$ayixiyyyyy", async function () {});
      }
      export const App = {
        prop: $ayixiyyyyy(),
      };
    
    `;
    assertTransform(code, expected);
  });
});

function __$(n: string, fn: any, args?: any[]) {}
