import { RouteResolver } from './route-resolver';
import fspath from 'path';
import fs from 'fs';
import kleur from 'kleur';

export class FileRouteResolver implements RouteResolver {
  constructor(public root: string, public pagesPath: string) {}

  async resolvePath(path?: string) {
    if (path === null || path === undefined) return null;

    const scriptPath =
      this.pagesPath +
      (path.endsWith('/') ? path + 'index' : path || '/index') +
      '.tsx';

    try {
      const stat = await fs.promises.stat(this.root + scriptPath, {});
      if (stat.isFile()) return scriptPath;
      console.warn(kleur.red(scriptPath));
      // console.log(stat);
    } catch (err) {}
    return null;
  }
}
