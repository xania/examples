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
  it('from inherited scope', () => {
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
      export const Compoadcmy = (setCompleted) =>
        __closure(
          "Compoadcmy",
          function Component() {
            return {
              children: setCompleted,
            };
          },
          [setCompleted]
        );
      export const setCojnhmq = __closure("setCojnhmq", function setCompleted() {});
      export function App() {
        return Compoadcmy(setCojnhmq);
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });
});
