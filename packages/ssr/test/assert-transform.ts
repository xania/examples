import { expect } from 'vitest';
import { transform } from '../lib/transform';
import prettier from 'prettier';

export function assertTransform(code: string, expectedOutput) {
  let transformedCode = transform(code, {
    entry: 'view',
    includeHelper: false,
  })!.code;

  try {
    const actualCode = prettier.format(transformedCode, {
      parser: 'babel',
    });

    const expectedCode = prettier.format(expectedOutput, {
      parser: 'babel',
    });

    expect(actualCode).toBe(expectedCode);
  } catch (ex) {
    console.error(
      '\n==============================\n' +
        transformedCode +
        '\n==============================\n'
    );
    throw ex;
  }
}
