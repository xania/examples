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
      export const handlfchsw = __closure("handlfchsw", function handler() {});
      export function App() {
        return handlfchsw();
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
      export const setCojbejr = __closure("setCojbejr", function setCompleted() {});
      export const Compoadqoe = (setCompleted) =>
        __closure(
          "Compoadqoe",
          function Component() {
            return {
              children: setCompleted,
            };
          },
          [setCompleted]
        );
      export function App() {
        return Compoadqoe(setCojbejr);
      }
      __closure("App", App);
    `;
    assertTransform(code, expected);
  });
});
