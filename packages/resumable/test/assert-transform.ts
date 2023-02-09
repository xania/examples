import { expect } from 'vitest';
import { transform, TransfromOptions } from '../lib/transform';
import prettier from 'prettier';

export function assertTransform(
  code: string,
  expectedOutput: string,
  options?: TransfromOptions
) {
  let transformedCode = transform(code, {
    ...options,
    includeHelper: false,
  })!.code;

  const actualCode = format(transformedCode);
  const expectedCode = format(expectedOutput);

  try {
    expect(actualCode).toBe(expectedCode);
  } catch (ex) {
    console.error(
      '\n==============================\n' +
        actualCode +
        '\n==============================\n'
    );
    throw ex;
  }

  function format(code: string) {
    try {
      return prettier.format(code, {
        parser: 'babel',
      });
    } catch (err) {
      console.error(err);
      return code;
    }
  }
}
