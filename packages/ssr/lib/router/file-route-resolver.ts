import kleur from 'kleur';
import { XaniaSsrOptions } from '../plugin';
import { RouteResolver } from './route-resolver';
// import kleur from 'kleur';
export class FileRouteResolver implements RouteResolver {
  constructor(
    public exists: XaniaSsrOptions['exists'],
    public root: string,
    public pagesPath: string
  ) {}

  async resolvePage(path?: string) {
    if (path === null || path === undefined) return Promise.resolve(null);

    const scriptPath =
      this.pagesPath +
      (path.endsWith('/') ? path + 'index' : path || '/index') +
      '.tsx';

    if (await this.exists(this.root + scriptPath)) {
      return this.root + scriptPath;
    }
    return null;
  }

  sayHello() {
    console.log(
      'SSR scripts will be resolved from: ' +
        kleur.gray(this.root) +
        kleur.green(this.pagesPath)
    );
  }
}
