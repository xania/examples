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
      export const App$tmqoipt = __$("App$tmqoipt", function App() {
        return "Hello App";
      });
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
      export const App$jxeilkt = __$("App$jxeilkt", async function App() {
        return "Hello App";
      });
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
      export const App$sjwlfok = __$("App$sjwlfok", function App() {
        return "Hello App";
      });
      export const App = App$sjwlfok;
    `;
    assertTransform(code, expected);
  });

  it('flag default function###', () => {
    const code = `
      export default function App() {
        return "Hello App";
      }
    `;
    const expected = `
      export const App$pswdilj = __$("App$pswdilj", function App() {
        return "Hello App";
      });
      export default App$pswdilj;
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
      export const $lwnxisabyt = __$("$lwnxisabyt", function () {
        return "Hello Anonymous";
      });
      export default $lwnxisabyt;
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
    export const App$bbilidh = (Compo$dfldr) =>
      __$(
        "App$bbilidh",
        function App() {
          return Compo$dfldr;
        },
        [Compo$dfldr]
      );
    export const Compo$dfldr = __$("Compo$dfldr", function Component() {});
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
      export const App$djukmjr = (Compo$chsbg) =>
        __$(
          "App$djukmjr",
          function App() {
            return Compo$chsbg;
          },
          [Compo$chsbg]
        );
      export const Compo$chsbg = __$("Compo$chsbg", async function Component() {});
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
      export const App$amqcbor = (Compo$exfaq) =>
        __$(
          "App$amqcbor",
          function App() {
            const a = 1;
      
            return Compo$exfaq(a)();
          },
          [Compo$exfaq]
        );
      export const Compo$exfaq = (a) =>
        __$(
          "Compo$exfaq",
          function Component() {
            return a;
          },
          [a]
        );
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
      export const App$pcdqivo = (Compo$wyekn) =>
        __$(
          "App$pcdqivo",
          function App(a = 1) {
            return Compo$wyekn(a);
          },
          [Compo$wyekn]
        );
      export const Compo$wyekn = (a) =>
        __$(
          "Compo$wyekn",
          function Component() {
            return a;
          },
          [a]
        );
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
      export const App$vhucbbj = (Compo$qechi) =>
        __$(
          "App$vhucbbj",
          function App() {
            return Compo$qechi;
          },
          [Compo$qechi]
        );
      export const Compo$qechi = __$("Compo$qechi", function Component() {
        return a;
      });
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
      export const App$qdchwsi = ($ekbfkukmqv) =>
        __$(
          "App$qdchwsi",
          function App() {
            const a = 1;
            return $ekbfkukmqv(a);
          },
          [$ekbfkukmqv]
        );
      export const $ekbfkukmqv = (a) =>
        __$(
          "$ekbfkukmqv",
          function () {
            return a;
          },
          [a]
        );
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
      export const App$qdchwtf = ($ekbfkukmik) =>
        __$(
          "App$qdchwtf",
          function App() {
            const a = 1;
            return $ekbfkukmik;
          },
          [$ekbfkukmik]
        );
      export const $ekbfkukmik = __$("$ekbfkukmik", function (a) {
        return a;
      });
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
      export const $tscsulffff = __$("$tscsulffff", function () {});
      export const App = {
        createELement: $tscsulffff,
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
      export const $qriussyyyy = __$("$qriussyyyy", async function () {});
      export const App = {
        createELement: $qriussyyyy,
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
      export const App$flninsi = ($uodtyghxmi, $ymcmycrwbw) =>
        __$(
          "App$flninsi",
          function App() {
            return compile().then($uodtyghxmi($ymcmycrwbw));
          },
          [$uodtyghxmi, $ymcmycrwbw]
        );
      export const $uodtyghxmi = ($ymcmycrwbw) =>
        __$(
          "$uodtyghxmi",
          (result) => {
            return {
              dispose: $ymcmycrwbw,
            };
          },
          [$ymcmycrwbw]
        );
      export const $ymcmycrwbw = __$("$ymcmycrwbw", function () {
        // dispose
      });
      export const App = App$flninsi($uodtyghxmi, $ymcmycrwbw);
      `;

    assertTransform(code, expected);
  });

  it('delay####', () => {
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
      export const App$lsbjykd = ($mgwbwxdhnh, $weemnbmmcf) =>
        __$(
          "App$lsbjykd",
          function App(value, ts = 1000) {
            return new Promise($mgwbwxdhnh(ts, $weemnbmmcf));
          },
          [$mgwbwxdhnh, $weemnbmmcf]
        );
      export const $mgwbwxdhnh = (ts, $weemnbmmcf) =>
        __$(
          "$mgwbwxdhnh",
          (resolve, reject) => {
            setTimeout($weemnbmmcf(resolve, value), ts);
          },
          [ts, $weemnbmmcf]
        );
      export const $weemnbmmcf = (resolve, value) =>
        __$(
          "$weemnbmmcf",
          function () {
            resolve(value);
          },
          [resolve, value]
        );
      export const App = App$lsbjykd($mgwbwxdhnh, $weemnbmmcf);
    `;

    assertTransform(code, expected);
  });

  it('local function reference  ####', () => {
    const code = `
      export function App(a) {
        function handler() {
          console.log(a);
        }

        return { a: handler };
      }
    `;

    const expected = `
      export const App$cjachpq = (handl$cybng) =>
        __$(
          "App$cjachpq",
          function App(a) {
            return { a: handl$cybng(a) };
          },
          [handl$cybng]
        );
      export const handl$cybng = (a) =>
        __$(
          "handl$cybng",
          function handler() {
            console.log(a);
          },
          [a]
        );
      export const App = App$cjachpq(handl$cybng);
    `;

    assertTransform(code, expected);
  });

  it('export default function declaration####', () => {
    const code = `
      export default function App() {
        return function Component() {}
      }
    `;

    const expected = `
      export const App$fkfwtdi = (Compo$omooc) =>
        __$(
          "App$fkfwtdi",
          function App() {
            return Compo$omooc;
          },
          [Compo$omooc]
        );
      export const Compo$omooc = __$("Compo$omooc", function Component() {});
      export default App$fkfwtdi;
    `;
    assertTransform(code, expected);
  });

  it('closure over root variable declaration###', () => {
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
      export const App$juxkhef = (Compo$qluqm) =>
        __$(
          "App$juxkhef",
          function App() {
            return Compo$qluqm(jsx);
          },
          [Compo$qluqm]
        );
      export const Compo$qluqm = (jsx) =>
        __$(
          "Compo$qluqm",
          function Component() {
            return jsx;
          },
          [jsx]
        );
      export default App$juxkhef;
    `;
    assertTransform(code, expected);
  });
});
