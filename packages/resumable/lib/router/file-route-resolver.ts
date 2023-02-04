import { RouteResolver } from './route-resolver';
import fs from 'fs/promises';

// import kleur from 'kleur';
export class FileRouteResolver implements RouteResolver {
  constructor(public baseDir: string) {}

  resolvePage = async (path?: string) => {
    if (path === null || path === undefined) return Promise.resolve(null);

    const scriptPath =
      this.baseDir +
      (path.endsWith('/') ? path + 'index' : path || '/index') +
      '.tsx';

    if (await exists(scriptPath)) {
      return scriptPath;
    }
    return null;
  };
}

async function exists(file: string) {
  try {
    const stats = await fs.stat(file, {});
    return stats.isFile();
  } catch (err) {
    return false;
  }
}
