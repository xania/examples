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
        return __$C(class State {}, "State$qeyou");
      }
      export const State = State$qeyou();
      
      export function App$fkuxmnc(State) {
        return __$C(
          function App() {
            return new State();
          },
          "App$fkuxmnc",
          [State]
        );
      }
      export const App = App$fkuxmnc(State);
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
        return __$C(
          function App() {
            const State = State$wyjkw();
      
            return new State();
          },
          "App$bloxyvh",
          [__$R("State$wyjkw")]
        );
      }
      export function State$wyjkw() {
        return __$C(class State {}, "State$wyjkw");
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
        return __$C(
          function App() {
            const a = 1;
            const State = State$cpdlo(a);
      
            return new State();
          },
          "App$jqronbf",
          [__$R("State$cpdlo")]
        );
      }
      export function State$cpdlo(a) {
        return __$C(
          class State {
            constructor() {
              console.log(a);
            }
          },
          "State$cpdlo",
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
        return __$C(
          class State {
            constructor() {
              console.log(this);
            }
          },
          "State$pvvqe"
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
        return __$C(
          class State {
            arrow = $yikjuqullw(this);
          },
          "State$cijbj",
          [__$R("$yikjuqullw")]
        );
      }
      export function $yikjuqullw(this_44) {
        return __$C(
          () => {
            return this_44;
          },
          "$yikjuqullw",
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
        return __$C(
          class State {
            method = $vdkkvnuikr();
          },
          "State$eurgi",
          [__$R("$vdkkvnuikr")]
        );
      }
      export function $vdkkvnuikr() {
        return __$C(function () {
          return this;
        }, "$vdkkvnuikr");
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
        return __$C(
          class State {
            get property() {
              return this;
            }
          },
          "State$cuurb"
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
        return __$C(class State {}, "State$qeyou");
      }
      export const State = State$qeyou();
      
      const App = App$saxjqbc(State, Compo$dbrtk);
      export function Compo$dbrtk(State) {
        return __$C(
          function Component() {
            return State;
          },
          "Compo$dbrtk",
          [State]
        );
      }
      export function App$saxjqbc(State, Compo$dbrtk) {
        return __$C(
          function App() {
            return Compo$dbrtk(State);
          },
          "App$saxjqbc",
          [State, __$R("Compo$dbrtk")]
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
        return __$C(
          class State {
            constructor() {
              this.arrow = $muvrivprxw(this);
            }
          },
          "State$gfoml",
          [__$R("$muvrivprxw")]
        );
      }
      export function $muvrivprxw(this_75) {
        return __$C(
          () => {
            return this_75;
          },
          "$muvrivprxw",
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
      export function JsxEl$cifgf($cpkkxugfxh, $aucqpvexsr) {
        return __$C(
          class JsxElement {
            setProp = $cpkkxugfxh($aucqpvexsr);
          },
          "JsxEl$cifgf",
          [__$R("$cpkkxugfxh"), __$R("$aucqpvexsr")]
        );
      }
      export function $cpkkxugfxh($aucqpvexsr) {
        return __$C(
          function () {
            call($aucqpvexsr(this));
      
            return this;
          },
          "$cpkkxugfxh",
          [__$R("$aucqpvexsr")]
        );
      }
      export function $aucqpvexsr(this_68) {
        return __$C(() => this_68, "$aucqpvexsr", [this_68]);
      }
      export const JsxElement = JsxEl$cifgf($cpkkxugfxh, $aucqpvexsr);
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
        return __$C(
          class App {
            method = $nofovriccc();
          },
          "App$fpfbanx",
          [__$R("$nofovriccc")]
        );
      }
      export function $nofovriccc() {
        return __$C(async function () {}, "$nofovriccc");
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
        return __$C(
          class App {
            static method = $mlepswnddd();
          },
          "App$naxpyxf",
          [__$R("$mlepswnddd")]
        );
      }
      export function $mlepswnddd() {
        return __$C(function () {}, "$mlepswnddd");
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
        return __$C(
          class App {
            static prop = $feqseystgo();
          },
          "App$abyijko",
          [__$R("$feqseystgo")]
        );
      }
      export function $feqseystgo() {
        return __$C(function () {}, "$feqseystgo");
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
        return __$C(async function () {}, "$ayixiyyyyy");
      }
      export const App = {
        prop: $ayixiyyyyy(),
      };
    `;
    assertTransform(code, expected);
  });
});

function __$(n: string, fn: any, args?: any[]) {}
