'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

describe('substitute func reference', () => {
  it('from same scope', () => {
    const code = `
      export function App() {
        function handler() {}
        return handler();
      }
      `;
    const expected = `
      export function App$ncsfemd(handl$omttt) {
        return __$(
          "App$ncsfemd",
          function App() {
            return handl$omttt()();
          },
          [handl$omttt]
        );
      }
      export function handl$omttt() {
        return __$("handl$omttt", function handler() {});
      }
      export const App = App$ncsfemd(handl$omttt);
      `;
    assertTransform(code, expected);
  });

  it('from property to parent scope####', () => {
    const code = `
      export function App() {
        function setCompleted() {}
        return function Component() {
          return {
            children: setCompleted
          }
        }
      }
      `;
    const expected = `
      export function App$afygqfa(setCo$slrkq, Compo$acmme) {
        return __$(
          "App$afygqfa",
          function App() {
            return Compo$acmme();
          },
          [setCo$slrkq, Compo$acmme]
        );
      }
      export function setCo$slrkq() {
        return __$("setCo$slrkq", function setCompleted() {});
      }
      export function Compo$acmme() {
        return __$("Compo$acmme", function Component() {
          return {
            children: setCompleted,
          };
        });
      }
      export const App = App$afygqfa(setCo$slrkq, Compo$acmme);
    `;
    assertTransform(code, expected);
  });

  it('from for statement####', () => {
    const code = `
      export function App() {
        function setCompleted() {}
        for(let i=0 ; i<100 ; i++) {
          return setCompleted();
        }
      }
      `;
    const expected = `
      export function App$uidmoal(setCo$slrkq) {
        return __$(
          "App$uidmoal",
          function App() {
            for (let i = 0; i < 100; i++) {
              return setCompleted();
            }
          },
          [setCo$slrkq]
        );
      }
      export function setCo$slrkq() {
        return __$("setCo$slrkq", function setCompleted() {});
      }
      export const App = App$uidmoal(setCo$slrkq);
      `;
    assertTransform(code, expected);
  });

  it('from class member to parent scope####', () => {
    const code = `
      export function App() {
        const a = 1;
        function setCompleted() {
          return a;
        }
        return class Component {
          setCompleted = setCompleted
        }
      }
      `;
    const expected = `
      export function App$qdibfod(setCo$nwlef, Compo$csvmj) {
        return __$(
          "App$qdibfod",
          function App() {
            const a = 1;
      
            return Compo$csvmj();
          },
          [setCo$nwlef, Compo$csvmj]
        );
      }
      export function setCo$nwlef(a) {
        return __$(
          "setCo$nwlef",
          function setCompleted() {
            return a;
          },
          [a]
        );
      }
      export function Compo$csvmj() {
        return __$(
          "Compo$csvmj",
          class Component {
            setCompleted = setCompleted;
          }
        );
      }
      export const App = App$qdibfod(setCo$nwlef, Compo$csvmj);
      `;
    assertTransform(code, expected);
  });
});
