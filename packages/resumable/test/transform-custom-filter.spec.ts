'strict';

import { describe, it } from 'vitest';
import { assertTransform } from './assert-transform';

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

describe('custom filter', () => {
  it('export setCompleted', () => {
    const expected = `
      export function setCo$oukbd(a) {
        return __$C(
          function setCompleted() {
            return a;
          },
          "setCo$oukbd",
          [a]
        );
      }
      export function App() {
        const a = 1;
        const setCompleted = setCo$oukbd(a);
      
        return class Component {
          setCompleted = setCompleted;
        };
      }
    `;
    assertTransform(code, expected, {
      filter(n) {
        return n === 'setCompleted';
      },
    });
  });

  it('export Component', () => {
    const expected = `
      export function Compo$kukne(setCompleted) {
        return __$C(
          class Component {
            setCompleted = setCompleted;
          },
          "Compo$kukne",
          [setCompleted]
        );
      }
      export function App() {
        const a = 1;
        function setCompleted() {
          return a;
        }
        return Compo$kukne(setCompleted);
      }
    `;
    assertTransform(code, expected, {
      filter(n) {
        return n === 'Component';
      },
    });
  });

  it('export App', () => {
    const expected = `
      export function App$kirgacs() {
        return __$C(function App() {
          const a = 1;
          function setCompleted() {
            return a;
          }
          return class Component {
            setCompleted = setCompleted;
          };
        }, "App$kirgacs");
      }
      export const App = App$kirgacs();
    `;
    assertTransform(code, expected, {
      filter(n) {
        return n === 'App';
      },
    });
  });

  it('export Component and setCompleted', () => {
    const expected = `
      export function setCo$oukbd(a) {
        return __$C(
          function setCompleted() {
            return a;
          },
          "setCo$oukbd",
          [a]
        );
      }
      export function Compo$kukne(setCompleted) {
        return __$C(
          class Component {
            setCompleted = setCompleted;
          },
          "Compo$kukne",
          [setCompleted]
        );
      }
      export function App() {
        const a = 1;
        const setCompleted = setCo$oukbd(a);
      
        return Compo$kukne(setCompleted);
      }
    `;
    assertTransform(code, expected, {
      filter(n) {
        return n === 'Component' || n === 'setCompleted';
      },
    });
  });

  it('export all', () => {
    const expected = `
      export function App$kirgacs(setCo$oukbd, Compo$kukne) {
        return __$C(
          function App() {
            const a = 1;
            const setCompleted = setCo$oukbd(a);
      
            return Compo$kukne(setCompleted);
          },
          "App$kirgacs",
          [__$R("setCo$oukbd"), __$R("Compo$kukne")]
        );
      }
      export function setCo$oukbd(a) {
        return __$C(
          function setCompleted() {
            return a;
          },
          "setCo$oukbd",
          [a]
        );
      }
      export function Compo$kukne(setCompleted) {
        return __$C(
          class Component {
            setCompleted = setCompleted;
          },
          "Compo$kukne",
          [setCompleted]
        );
      }
      export const App = App$kirgacs(setCo$oukbd, Compo$kukne);
    `;
    assertTransform(code, expected, {
      filter(n) {
        return true;
      },
    });
  });
});
