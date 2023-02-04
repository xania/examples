import type { Plugin } from 'vite';
import kleur from 'kleur';
import { FileRouteResolver, transform, ViewResult } from '../../resumable';

export interface Options {
  resolvePage?(url: string): Promise<string>;
}

export function createPageResolver(baseDir: string) {
  new FileRouteResolver(baseDir).resolvePage;
}

export function resumabl(xn?: Options): Plugin {
  return {
    name: 'vite-plugin-resumable',
    configureServer(vite) {
      function createDefaultPageResolver() {
        console.log(
          'Resumable scripts will be resolved from: ' +
            kleur.gray(vite.config.root) +
            kleur.green('/pages')
        );
        return new FileRouteResolver(vite.config.root + '/pages').resolvePage;
      }
      const resolvePage = xn?.resolvePage ?? createDefaultPageResolver();

      vite.middlewares.use(async (req, res, next) => {
        if (req.headers.accept?.includes('text/html')) {
          const reqUrl = req.url || '';
          const pageUrl = await resolvePage(reqUrl);
          if (pageUrl) {
            try {
              const page = await vite.ssrLoadModule(pageUrl, {
                fixStacktrace: true,
              });

              const handler = page.default ?? page?.view;

              if (handler instanceof Function) {
                let responseHtml = '';
                await new ViewResult(await handler()).execute(
                  req,
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
                  } as any,
                  next
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
            }
          }
        }

        return next();
      });
    },
    async resolveId(source, importer, options) {
      if (options.ssr) {
        const resolved = await this.resolve(source, importer, options);
      }
      // const match = source.match(/\:(.*)$/);
      // if (match) {
      //   const resolved = await this.resolve(
      //     source.slice(0, match.index),
      //     importer,
      //     options
      //   );

      //   if (resolved) {
      //     return {
      //       ...resolved,
      //       id: resolved?.id + match[0],
      //     };
      //   }
      // }
    },

    transform(code, id, options) {
      if (id.match(/\.[tj]sx?$/)) {
        return transform(code, {});
      }

      return undefined;
    },
  } as Plugin;
}

// import { createFilter } from "@rollup/pluginutils";

// export default function transformCodePlugin(options: any = {}) {
//   const filter = createFilter(options.include, options.exclude);

//   return {
//     name: "xanify-jsx",
//     transform(code, id) {
//       if (!filter(id)) return;

//       console.log(code);
//       // proceed with the transformation...
//       return {
//         code: code,
//         map: null,
//       };
//     },
//     load() {},
//   };
// }
