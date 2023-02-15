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
      export function App$tmqoipt() {
        return __$("App$tmqoipt", function App() {
          return "Hello App";
        });
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
      export function App$jxeilkt() {
        return __$("App$jxeilkt", async function App() {
          return "Hello App";
        });
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
        return __$("App$sjwlfok", function App() {
          return "Hello App";
        });
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
        return __$("App$pswdilj", function App() {
          return "Hello App";
        });
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
        return __$("$lwnxisabyt", function () {
          return "Hello Anonymous";
        });
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
        return __$(
          "App$bbilidh",
          function App() {
            return Compo$dfldr();
          },
          [Compo$dfldr]
        );
      }
      export function Compo$dfldr() {
        return __$("Compo$dfldr", function Component() {});
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
        return __$(
          "App$djukmjr",
          function App() {
            return Compo$chsbg();
          },
          [Compo$chsbg]
        );
      }
      export function Compo$chsbg() {
        return __$("Compo$chsbg", async function Component() {});
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
        return __$(
          "App$amqcbor",
          function App() {
            const a = 1;
      
            return Compo$exfaq(a)();
          },
          [Compo$exfaq]
        );
      }
      export function Compo$exfaq(a) {
        return __$(
          "Compo$exfaq",
          function Component() {
            return a;
          },
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
        return __$(
          "App$pcdqivo",
          function App(a = 1) {
            return Compo$wyekn(a);
          },
          [Compo$wyekn]
        );
      }
      export function Compo$wyekn(a) {
        return __$(
          "Compo$wyekn",
          function Component() {
            return a;
          },
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
        return __$(
          "App$vhucbbj",
          function App() {
            return Compo$qechi();
          },
          [Compo$qechi]
        );
      }
      export function Compo$qechi() {
        return __$("Compo$qechi", function Component() {
          return a;
        });
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
        return __$(
          "App$qdchwsi",
          function App() {
            const a = 1;
            return $ekbfkukmqv(a);
          },
          [$ekbfkukmqv]
        );
      }
      export function $ekbfkukmqv(a) {
        return __$(
          "$ekbfkukmqv",
          function () {
            return a;
          },
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
        return __$(
          "App$qdchwtf",
          function App() {
            const a = 1;
            return $ekbfkukmik();
          },
          [$ekbfkukmik]
        );
      }
      export function $ekbfkukmik() {
        return __$("$ekbfkukmik", function (a) {
          return a;
        });
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
        return __$("$tscsulffff", function () {});
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
        return __$("$qriussyyyy", async function () {});
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
        return __$(
          "App$flninsi",
          function App() {
            return compile().then($uodtyghxmi($ymcmycrwbw));
          },
          [$ymcmycrwbw, $uodtyghxmi]
        );
      }
      export function $uodtyghxmi($ymcmycrwbw) {
        return __$(
          "$uodtyghxmi",
          (result) => {
            return {
              dispose: $ymcmycrwbw(),
            };
          },
          [$ymcmycrwbw]
        );
      }
      export function $ymcmycrwbw() {
        return __$("$ymcmycrwbw", function () {
          // dispose
        });
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
        return __$(
          "App$lsbjykd",
          function App(value, ts = 1000) {
            return new Promise($mgwbwxdhnh(ts, value, $weemnbmmcf));
          },
          [$weemnbmmcf, $mgwbwxdhnh]
        );
      }
      export function $mgwbwxdhnh(ts, value, $weemnbmmcf) {
        return __$(
          "$mgwbwxdhnh",
          (resolve, reject) => {
            setTimeout($weemnbmmcf(resolve, value), ts);
          },
          [ts, value, $weemnbmmcf]
        );
      }
      export function $weemnbmmcf(resolve, value) {
        return __$(
          "$weemnbmmcf",
          function () {
            resolve(value);
          },
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
        return __$(
          "App$cjachpq",
          function App(a) {
            return { a: handl$cybng(a) };
          },
          [handl$cybng]
        );
      }
      export function handl$cybng(a) {
        return __$(
          "handl$cybng",
          function handler() {
            console.log(a);
          },
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
        return __$(
          "App$fkfwtdi",
          function App() {
            return Compo$omooc();
          },
          [Compo$omooc]
        );
      }
      export function Compo$omooc() {
        return __$("Compo$omooc", function Component() {});
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
        return __$(
          "App$juxkhef",
          function App() {
            return Compo$qluqm(jsx);
          },
          [jsx, Compo$qluqm]
        );
      }
      export function Compo$qluqm(jsx) {
        return __$(
          "Compo$qluqm",
          function Component() {
            return jsx;
          },
          [jsx]
        );
      }
      const App = App$juxkhef(jsx, Compo$qluqm);
      export default App;
    `;
    assertTransform(code, expected);
  });
});
