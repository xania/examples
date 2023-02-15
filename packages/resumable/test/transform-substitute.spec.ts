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
        return __$C(
          function App() {
            const handler = handl$omttt();
      
            return handler();
          },
          "App$ncsfemd",
          [__$R("handl$omttt")]
        );
      }
      export function handl$omttt() {
        return __$C(function handler() {}, "handl$omttt");
      }
      export const App = App$ncsfemd(handl$omttt);
      `;
    assertTransform(code, expected);
  });

  it('from property to parent scope', () => {
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
        return __$C(
          function App() {
            const setCompleted = setCo$slrkq();
      
            return Compo$acmme(setCompleted);
          },
          "App$afygqfa",
          [__$R("setCo$slrkq"), __$R("Compo$acmme")]
        );
      }
      export function setCo$slrkq() {
        return __$C(function setCompleted() {}, "setCo$slrkq");
      }
      export function Compo$acmme(setCompleted) {
        return __$C(
          function Component() {
            return {
              children: setCompleted,
            };
          },
          "Compo$acmme",
          [setCompleted]
        );
      }
      export const App = App$afygqfa(setCo$slrkq, Compo$acmme);
    `;
    assertTransform(code, expected);
  });

  it('from for statement', () => {
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
        return __$C(
          function App() {
            const setCompleted = setCo$slrkq();
      
            for (let i = 0; i < 100; i++) {
              return setCompleted();
            }
          },
          "App$uidmoal",
          [__$R("setCo$slrkq")]
        );
      }
      export function setCo$slrkq() {
        return __$C(function setCompleted() {}, "setCo$slrkq");
      }
      export const App = App$uidmoal(setCo$slrkq);
      `;
    assertTransform(code, expected);
  });

  it('from class member to parent scope', () => {
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
        return __$C(
          function App() {
            const a = 1;
            const setCompleted = setCo$nwlef(a);
      
            return Compo$csvmj(setCompleted);
          },
          "App$qdibfod",
          [__$R("setCo$nwlef"), __$R("Compo$csvmj")]
        );
      }
      export function setCo$nwlef(a) {
        return __$C(
          function setCompleted() {
            return a;
          },
          "setCo$nwlef",
          [a]
        );
      }
      export function Compo$csvmj(setCompleted) {
        return __$C(
          class Component {
            setCompleted = setCompleted;
          },
          "Compo$csvmj",
          [setCompleted]
        );
      }
      export const App = App$qdibfod(setCo$nwlef, Compo$csvmj);
    `;
    assertTransform(code, expected);
  });
});
