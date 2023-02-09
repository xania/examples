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
      export const handlomttt = __closure("handlomttt", function handler() {});
      export function App() {
        return handlomttt();
      }
      __closure("App", App);
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
      export const setCoslrkq = __closure("setCoslrkq", function setCompleted() {});
      export const Compoacmme = __closure(
          "Compoacmme",
          function Component() {
            return {
              children: setCoslrkq,
            };
          }
        );
      export function App() {
        return Compoacmme;
      }
      __closure("App", App);
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
      export const setCoslrkq = __closure("setCoslrkq", function setCompleted() {});
      export function App() {
        for (let i = 0; i < 100; i++) {
          return setCoslrkq();
        }
      }
      __closure("App", App);
      `;
    assertTransform(code, expected);
  });

  it('from class member to parent scope', () => {
    const code = `
      export function App() {
        function setCompleted() {}
        return class Component {
          setCompleted = setCompleted
        }
      }
      `;
    const expected = `
      export const setCoslrkq = __closure("setCoslrkq", function setCompleted() {});
      export const Compoifuqa = __closure(
        "Compoifuqa",
        class Component {
          setCompleted = setCoslrkq;
        }
      );
      export function App() {
        return Compoifuqa;
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });
});
