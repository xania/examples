import type { Plugin } from 'vite';
import kleur from 'kleur';
import { FileRouteResolver, transform, ViewResult } from '../../resumable/';

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
        if (req.headers.accept?.includes('text/html')) {
          const reqUrl = req.url || '';
          const pageUrl = await resolvePage(reqUrl);
          if (pageUrl) {
            try {
              const page = await vite.ssrLoadModule(pageUrl, {
                fixStacktrace: false,
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
              throw err;
            }
          }
        }

        return next();
      });
    },

    // resolveId: {
    //   order: 'post',
    //   handler: async function (source, importer, options) {
    //     const baseFile =
    //       importer && importer.startsWith('/')
    //         ? 'c:/dev/xania-examples' + importer
    //         : importer;

    //     const url = parseResumeUrl(source);
    //     if (url) {
    //       const resolved = await this.resolve(url, baseFile, options);
    //       if (resolved) {
    //         return {
    //           ...resolved,
    //           id: toResumeUrl(resolved.id),
    //         };
    //       }
    //       return resolved;
    //     }
    //   },
    // },

    // async load(id, options) {
    //   const url = parseResumeUrl(id);
    //   if (url) {
    //     const resolved = await this.resolve(url);
    //     if (resolved) {
    //       const file = resolved.id;
    //       const code = await promises.readFile(file, 'utf-8');

    //       return {
    //         code,
    //       };
    //     }
    //   }
    // },

    transform: {
      order: 'post',
      async handler(code, id, options) {
        try {
          if (/\.[tj]sx?$/.test(id) && options?.ssr) {
            const result = transform(code, {});
            if (id.endsWith('hibernate.ts')) {
              debugger;
            }
            return result;
          }
        } catch {
          debugger;
        }

        return undefined;
      },
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

// function parseResumeUrl(id: string | undefined) {
//   if (!id) return null;
//   const match = id.match(/\.resume\.[jt]sx?$/);
//   if (match) {
//     const ext = id.slice((match.index || 0) + 7);
//     const url = id.slice(0, match.index) + ext;
//     return url;
//   }
//   return null;
// }

// function toResumeUrl(url: string) {
//   const match = url.match(/\.[jt]sx?$/);
//   if (!match) {
//     return url;
//   }

//   return url.slice(0, match.index) + '.resume' + url.slice(match.index);
// }
