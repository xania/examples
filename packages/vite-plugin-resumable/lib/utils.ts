import path from 'node:path';

export function fileToUrl(file: string, root: string) {
  return '/' + path.relative(root, file).replaceAll('\\', '/');
}
