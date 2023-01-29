import { expect } from 'vitest';
import { transform } from '../lib/transform';
import prettier from 'prettier';

export function assertTransform(code: string, expectedOutput) {
  const transformedCode = prettier.format(
    transform(code, { entry: 'view', includeHelper: false })!.code,
    {
      parser: 'babel',
    }
  );

  const expectedCode = prettier.format(expectedOutput, {
    parser: 'babel',
  });

  console.log(
    '\n==============================\n' +
      transformedCode +
      '\n==============================\n'
  );

  expect(transformedCode).toBe(expectedCode);
}
