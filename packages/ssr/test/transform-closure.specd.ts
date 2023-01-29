'strict';

import { it, describe } from 'vitest';
import { assertTransform } from './assert-transform';

describe('trivial entry', () => {
  it('', () => {
    const code = `
    export function view() {
      return "Hello World ";
    }
    `;

    assertTransform(code, code);
  });
});

describe('closure', () => {
  it('return arrow function closure', () => {
    const code = `
      export function view() {
        return () => 'view';
      }
    `;

    const expected = `
      export function view() {
        return wqfbafxgso();
      }
      export const wqfbafxgso = () => __closure('wqfbafxgso', () => 'view')
    `;

    assertTransform(code, expected);
  });

  it('nested closures', () => {
    const code = `
      export function view() {
        return [function() { return "Hello World";}, () => 123]
      }
    `;

    const expected = `
      export function view() {
        return [rmxaoqwoxr(), wvfbafnml_()]
      }
      export const rmxaoqwoxr = () => __closure('rmxaoqwoxr', function() { return "Hello World";});
      export const wvfbafnml_ = () => __closure('wvfbafnml_', () => 123);
    `;

    assertTransform(code, expected);
  });

  it('property function declaration', () => {
    const code = `
      export function view() {
        return { a: function() { return 'view' } };
      }
    `;

    const expected = `
      export function view() {
        return { a: mrtcwkwgwl() };
      }
      export const mrtcwkwgwl = () => __closure('mrtcwkwgwl', function() { return 'view' })`;

    assertTransform(code, expected);
  });

  it('trapped variables', () => {
    const code = `
      export function view() {
        const state = new State();
        return function() { return state };
      }
    `;

    const expected = `
      export function view() {
        const state = new State();
        return vplreramwl(state);
      }
      export const vplreramwl = (state) => __closure('vplreramwl', function() { return state }, [state])
    `;

    assertTransform(code, expected);
  });

  it('trapped variables embedded function', () => {
    const code = `
      export function view() {
        const state = new State();
        return { a: () => log(state) };
      }
    `;

    const expected = `
      export function view() {
        const state = new State();
        return { a: supassvyqw(state) };
      }
      export const supassvyqw = (state) => __closure('supassvyqw', () => log(state), [state])
    `;

    assertTransform(code, expected);
  });

  it('closure declared vars', () => {
    const code = `
      export function view() {
        return { a: function() {
            const state = new State();
            return state;
          }
        };
      }
    `;

    const expect = `
      export function view() {
        return { a: bimbgohwqq() };
      }
      export const bimbgohwqq = () => __closure('bimbgohwqq', function () {
        const state = new State();
        return state;
      })`;

    assertTransform(code, expect);
  });

  it('init property function', () => {
    const code = `
      export function view() {
        return {
          createElement(x, y) {
            return [x, y]
          }
        }
      }
    `;

    const expect = `
      export function view() {
        return {
          createElement: vcotjomdpb(),
        };
      }
      export const vcotjomdpb = () =>
        __closure("vcotjomdpb", function (x, y) {
          return [x, y];
        });
      `;

    assertTransform(code, expect);
  });

  it('unresolved reference is ignored', () => {
    const code = `
      export function view() {
        return function() {
          return a;
        }
      }
    `;

    const expect = `
      export function view() {
        return cdarlmnjpl()
      }
      export const cdarlmnjpl = () => __closure("cdarlmnjpl", function() {
        return a;
      })
    `;

    assertTransform(code, expect);
  });

  it('trapped params', () => {
    const code = `
      export function view(a) {
        return function() {
          return a;
        }
      }
    `;

    const expect = `
      export function view(a) {
        return cdarlmnjpl(a)
      }
      export const cdarlmnjpl = (a) => __closure("cdarlmnjpl", function() {
        return a;
      }, [a])
    `;

    assertTransform(code, expect);
  });
});
