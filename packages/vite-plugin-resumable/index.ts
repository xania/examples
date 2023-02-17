import { Plugin } from 'vite';

import kleur from 'kleur';
import { FileRouteResolver, ViewResult } from '../resumable';
import { createLoader } from './lib/page-loader';

export interface Options {
  resolvePage?(url: string): Promise<string>;
}

export function createPageResolver(baseDir: string) {
  new FileRouteResolver(baseDir).resolvePage;
}

export function resumable(xn?: Options): Plugin {
  return {
    name: 'vite-plugin-resumable',
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
        const result = await loader.loadAndTransform(reqUrl);
        if (result) {
          res.setHeader('Content-Type', 'application/javascript');
          res.write(result.code);
          res.write(result.genSourceMap());
          res.end();
          return;
        }

        if (req.headers.accept?.includes('text/html')) {
          const pageUrl = await resolvePage(reqUrl);
          if (pageUrl) {
            try {
              const loader = createLoader(vite);
              const page = await loader.loadResumableModule(pageUrl, 'server');
              if (!page) {
                return next();
              }

              const handler = page.default ?? page?.view;

              if (handler instanceof Function) {
                let responseHtml = '';
                await new ViewResult(await handler()).execute(
                  vite.config.root,
                  {
                    write(s: string) {
                      responseHtml += s;
                    },
                    async end(data: any) {
                      if (data) {
                        responseHtml += data;
                      }
                      const transformedHtml = await vite.transformIndexHtml(
                        pageUrl,
                        responseHtml,
                        req.originalUrl
                      );
                      res.end(transformedHtml);
                    },
                  } as any
                );
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
