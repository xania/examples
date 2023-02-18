import { Plugin } from 'vite';

import kleur from 'kleur';
import { FileRouteResolver } from '../resumable';
import { createLoader, parseResumableUrl } from './lib/page-loader';
import { HibernationWriter } from './lib/hibernate/writer';
import path from 'node:path';
import url from 'node:url';
import { fileToUrl } from './lib/utils';

export interface Options {
  resolvePage?(url: string): Promise<string>;
}

export function createPageResolver(baseDir: string) {
  new FileRouteResolver(baseDir).resolvePage;
}

function prop<K extends keyof T, T>(object: T, name: K, def: T[K]): T[K] {
  const existing = object[name];
  if (existing) return existing;
  return (object[name] = def);
}

export function resumable(xn?: Options): Plugin {
  return {
    name: 'vite-plugin-resumable',
    // config(config, env) {
    //   const alias = {
    //     '@hydrate': path.resolve(__dirname, './lib/hydrate/index.ts'),
    //   };

    //   if (!config.resolve) {
    //     config.resolve = {
    //       alias: alias,
    //     };
    //   } else if (config.resolve.alias) {
    //     Object.assign(config.resolve.alias, alias);
    //   }
    // },
    configureServer(vite) {
      function createDefaultPageResolver() {
        console.log(
          'Resumable scripts will be resolved from: ' +
            kleur.gray(vite.config.root) +
            kleur.green('/pages')
        );
        const resolver = new FileRouteResolver(vite.config.root + '/pages');

        return (url: string) => {
          return resolver.resolvePage(url);
        };
      }
      const resolvePage = xn?.resolvePage ?? createDefaultPageResolver();

      vite.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        const loader = createLoader(vite);

        const parseResult = parseResumableUrl(reqUrl);
        if (parseResult) {
          const result = await loader.loadAndTransform(
            parseResult.moduleUrl,
            parseResult.target,
            parseResult.entries
          );
          if (result) {
            res.setHeader('Content-Type', 'application/javascript');
            res.write(result.code);
            res.write(result.genSourceMap());
            res.end();
            return;
          }
        } else if (req.headers.accept?.includes('text/html')) {
          const pageUrl = await resolvePage(reqUrl);
          if (pageUrl) {
            try {
              const loader = createLoader(vite);
              const page = await loader.loadResumableModule(pageUrl);
              if (!page) {
                return next();
              }

              const handler = page.default ?? page?.view;

              if (handler instanceof Function) {
                let responseHtml = '';

                const hydrate = await vite.pluginContainer.resolveId(
                  path.resolve(__dirname, './lib/hydrate/index.ts')
                );

                const writer = new HibernationWriter(
                  vite.config.root,
                  res,
                  fileToUrl(hydrate!.id, vite.config.root)
                );
                await writer.write(await handler());

                const transformedHtml = await vite.transformIndexHtml(
                  pageUrl,
                  responseHtml,
                  req.originalUrl
                );
                res.write(transformedHtml);
                res.end();
                return;
              } else {
                console.warn(
                  kleur.yellow(
                    `page as '${pageUrl}' does not define view handler`
                  )
                );
              }
            } catch (err: any) {
              console.log(kleur.red(err));
              throw err;
            }
          }
        }

        return next();
      });
    },
    resolveId(source, importer, options) {
      const prefix = '/@resumable';
      if (source.startsWith(prefix)) {
        return {
          id: source,
        };
      }
      return;
    },
  } as Plugin;
}
