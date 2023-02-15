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
      const App = App$tmqoipt();
      export function App$tmqoipt() {
        return __$C(function App() {
          return "Hello App";
        }, "App$tmqoipt");
      } 
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
      const App = App$jxeilkt();
      export function App$jxeilkt() {
        return __$C(async function App() {
          return "Hello App";
        }, "App$jxeilkt");
      }
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
      export function App$sjwlfok() {
        return __$C(function App() {
          return "Hello App";
        }, "App$sjwlfok");
      }
      export const App = App$sjwlfok();
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
      export function App$pswdilj() {
        return __$C(function App() {
          return "Hello App";
        }, "App$pswdilj");
      }
      const App = App$pswdilj();
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
      export function $lwnxisabyt() {
        return __$C(function () {
          return "Hello Anonymous";
        }, "$lwnxisabyt");
      }
      export default $lwnxisabyt();
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
      export function App$bbilidh(Compo$dfldr) {
        return __$C(
          function App() {
            return Compo$dfldr();
          },
          "App$bbilidh",
          [__$R("Compo$dfldr")]
        );
      }
      export function Compo$dfldr() {
        return __$C(function Component() {}, "Compo$dfldr");
      }
      export const App = App$bbilidh(Compo$dfldr);
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
      export function App$djukmjr(Compo$chsbg) {
        return __$C(
          function App() {
            const Component = Compo$chsbg();

            return Component;
          },
          "App$djukmjr",
          [__$R("Compo$chsbg")]
        );
      }
      export function Compo$chsbg() {
        return __$C(async function Component() {}, "Compo$chsbg");
      }
      export const App = App$djukmjr(Compo$chsbg);
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
      export function App$amqcbor(Compo$exfaq) {
        return __$C(
          function App() {
            const a = 1;
            const Component = Compo$exfaq(a);
      
            return Component();
          },
          "App$amqcbor",
          [__$R("Compo$exfaq")]
        );
      }
      export function Compo$exfaq(a) {
        return __$C(
          function Component() {
            return a;
          },
          "Compo$exfaq",
          [a]
        );
      }
      export const App = App$amqcbor(Compo$exfaq);
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
      export function App$pcdqivo(Compo$wyekn) {
        return __$C(
          function App(a = 1) {
            return Compo$wyekn(a);
          },
          "App$pcdqivo",
          [__$R("Compo$wyekn")]
        );
      }
      export function Compo$wyekn(a) {
        return __$C(
          function Component() {
            return a;
          },
          "Compo$wyekn",
          [a]
        );
      }
      export const App = App$pcdqivo(Compo$wyekn);
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
      export function App$vhucbbj(Compo$qechi) {
        return __$C(
          function App() {
            return Compo$qechi();
          },
          "App$vhucbbj",
          [__$R("Compo$qechi")]
        );
      }
      export function Compo$qechi() {
        return __$C(function Component() {
          return a;
        }, "Compo$qechi");
      }
      export const App = App$vhucbbj(Compo$qechi);
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
      export function App$qdchwsi($ekbfkukmqv) {
        return __$C(
          function App() {
            const a = 1;
            return $ekbfkukmqv(a);
          },
          "App$qdchwsi",
          [__$R("$ekbfkukmqv")]
        );
      }
      export function $ekbfkukmqv(a) {
        return __$C(
          function () {
            return a;
          },
          "$ekbfkukmqv",
          [a]
        );
      }
      export const App = App$qdchwsi($ekbfkukmqv);
  `;
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
      export function App$qdchwtf($ekbfkukmik) {
        return __$C(
          function App() {
            const a = 1;
            return $ekbfkukmik();
          },
          "App$qdchwtf",
          [__$R("$ekbfkukmik")]
        );
      }
      export function $ekbfkukmik() {
        return __$C(function (a) {
          return a;
        }, "$ekbfkukmik");
      }
      export const App = App$qdchwtf($ekbfkukmik);
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
      export function $tscsulffff() {
        return __$C(function () {}, "$tscsulffff");
      }
      export const App = {
        createELement: $tscsulffff(),
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
      export function $qriussyyyy() {
        return __$C(async function () {}, "$qriussyyyy");
      }
      export const App = {
        createELement: $qriussyyyy(),
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
      export function App$flninsi($ymcmycrwbw, $uodtyghxmi) {
        return __$C(
          function App() {
            return compile().then($uodtyghxmi($ymcmycrwbw));
          },
          "App$flninsi",
          [__$R("$ymcmycrwbw"), __$R("$uodtyghxmi")]
        );
      }
      export function $uodtyghxmi($ymcmycrwbw) {
        return __$C(
          (result) => {
            return {
              dispose: $ymcmycrwbw(),
            };
          },
          "$uodtyghxmi",
          [__$R("$ymcmycrwbw")]
        );
      }
      export function $ymcmycrwbw() {
        return __$C(function () {
          // dispose
        }, "$ymcmycrwbw");
      }
      export const App = App$flninsi($ymcmycrwbw, $uodtyghxmi);
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
      export function App$lsbjykd($weemnbmmcf, $mgwbwxdhnh) {
        return __$C(
          function App(value, ts = 1000) {
            return new Promise($mgwbwxdhnh($weemnbmmcf, ts, value));
          },
          "App$lsbjykd",
          [__$R("$weemnbmmcf"), __$R("$mgwbwxdhnh")]
        );
      }
      export function $mgwbwxdhnh($weemnbmmcf, ts, value) {
        return __$C(
          (resolve, reject) => {
            setTimeout($weemnbmmcf(resolve, value), ts);
          },
          "$mgwbwxdhnh",
          [__$R("$weemnbmmcf"), ts, value]
        );
      }
      export function $weemnbmmcf(resolve, value) {
        return __$C(
          function () {
            resolve(value);
          },
          "$weemnbmmcf",
          [resolve, value]
        );
      }
      export const App = App$lsbjykd($weemnbmmcf, $mgwbwxdhnh);
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
      export function App$cjachpq(handl$cybng) {
        return __$C(
          function App(a) {
            const handler = handl$cybng(a);
      
            return { a: handler };
          },
          "App$cjachpq",
          [__$R("handl$cybng")]
        );
      }
      export function handl$cybng(a) {
        return __$C(
          function handler() {
            console.log(a);
          },
          "handl$cybng",
          [a]
        );
      }
      export const App = App$cjachpq(handl$cybng);
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
      export function App$fkfwtdi(Compo$omooc) {
        return __$C(
          function App() {
            return Compo$omooc();
          },
          "App$fkfwtdi",
          [__$R("Compo$omooc")]
        );
      }
      export function Compo$omooc() {
        return __$C(function Component() {}, "Compo$omooc");
      }
      const App = App$fkfwtdi(Compo$omooc);
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
      const jsx = null;
      export function App$juxkhef(jsx, Compo$qluqm) {
        return __$C(
          function App() {
            return Compo$qluqm(jsx);
          },
          "App$juxkhef",
          [jsx, __$R("Compo$qluqm")]
        );
      }
      export function Compo$qluqm(jsx) {
        return __$C(
          function Component() {
            return jsx;
          },
          "Compo$qluqm",
          [jsx]
        );
      }
      const App = App$juxkhef(jsx, Compo$qluqm);
      export default App;
    `;
    assertTransform(code, expected);
  });
});
