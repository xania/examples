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
      export const App$ncsfemd = (handl$omttt) =>
        __$("App$ncsfemd", function App() {
            return handl$omttt();
          }, [handl$omttt]
        );
      export const handl$omttt = __$("handl$omttt", function handler() {});
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
      export const App$afygqfa = (setCo$slrkq, Compo$acmme) =>
        __$(
          "App$afygqfa",
          function App() {
            return Compo$acmme(setCo$slrkq);
          },
          [setCo$slrkq, Compo$acmme]
        );
      export const setCo$slrkq = __$("setCo$slrkq", function setCompleted() {});
      export const Compo$acmme = (setCompleted) =>
        __$(
          "Compo$acmme",
          function Component() {
            return {
              children: setCompleted,
            };
          },
          [setCompleted]
        );
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
      export const App$uidmoal = (setCo$slrkq) =>
        __$(
          "App$uidmoal",
          function App() {
            for (let i = 0; i < 100; i++) {
              return setCo$slrkq();
            }
          },
          [setCo$slrkq]
        );
      export const setCo$slrkq = __$("setCo$slrkq", function setCompleted() {});
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
      export const App$qdibfod = (setCo$nwlef, Compo$csvmj) =>
        __$("App$qdibfod",
          function App() {
            const a = 1;
      
            return Compo$csvmj(setCo$nwlef(a));
          },
          [setCo$nwlef, Compo$csvmj]
        );
      export const setCo$nwlef = (a) =>
        __$("setCo$nwlef",
          function setCompleted() {
            return a;
          },
          [a]
        );
      export const Compo$csvmj = (setCompleted) =>
        __$("Compo$csvmj",
          class Component {
            setCompleted = setCompleted;
          },
          [setCompleted]
        );
      export const App = App$qdibfod(setCo$nwlef, Compo$csvmj);
      `;
    assertTransform(code, expected);
  });
});
