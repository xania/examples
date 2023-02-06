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
      export const handlfoakt = __closure("handlfoakt", function handler() {});
      export function App() {
        return handlfoakt();
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
      export const setCojnhmq = __closure("setCojnhmq", function setCompleted() {});
      export const Compoadcmy = __closure(
          "Compoadcmy",
          function Component() {
            return {
              children: setCojnhmq,
            };
          }
        );
      export function App() {
        return Compoadcmy;
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
      export const setCojnhmq = __closure("setCojnhmq", function setCompleted() {});
      export function App() {
        for (let i = 0; i < 100; i++) {
          return setCojnhmq();
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
      export const setCojnhmq = __closure("setCojnhmq", function setCompleted() {});
      export const Compocivck = __closure(
        "Compocivck",
        class Component {
          setCompleted = setCojnhmq;
        }
      );
      export function App() {
        return Compocivck;
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });
});
