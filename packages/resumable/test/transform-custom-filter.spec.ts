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

describe('from class member to parent scope', () => {
  it('export setCompleted', () => {
    const expected = `
      export function setCo$oukbd(a) {
        return __$(
          "setCo$oukbd",
          function setCompleted() {
            return a;
          },
          [a]
        );
      }
      export function App() {
        const a = 1;
      
        return class Component {
          setCompleted = setCo$oukbd(a);
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
        return __$(
          "Compo$kukne",
          class Component {
            setCompleted = setCompleted;
          },
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
        return __$("App$kirgacs", function App() {
          const a = 1;
          function setCompleted() {
            return a;
          }
          return class Component {
            setCompleted = setCompleted;
          };
        });
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
        return __$(
          "setCo$oukbd",
          function setCompleted() {
            return a;
          },
          [a]
        );
      }
      export function Compo$kukne(a, setCo$oukbd) {
        return __$(
          "Compo$kukne",
          class Component {
            setCompleted = setCo$oukbd(a);
          },
          [a, setCo$oukbd]
        );
      }
      export function App() {
        const a = 1;
      
        return Compo$kukne(a, setCo$oukbd);
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
        return __$(
          "App$kirgacs",
          function App() {
            const a = 1;
      
            return Compo$kukne(a, setCo$oukbd);
          },
          [setCo$oukbd, Compo$kukne]
        );
      }
      export function setCo$oukbd(a) {
        return __$(
          "setCo$oukbd",
          function setCompleted() {
            return a;
          },
          [a]
        );
      }
      export function Compo$kukne(a, setCo$oukbd) {
        return __$(
          "Compo$kukne",
          class Component {
            setCompleted = setCo$oukbd(a);
          },
          [a, setCo$oukbd]
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
