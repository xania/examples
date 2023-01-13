import type { Plugin } from 'vite';
import { walk } from 'estree-walker';
// import { CallExpression, Identifier, MemberExpression } from 'estree';

import kleur from 'kleur';
import { FileRouteResolver } from '../router';

const types = new Set<string>();
function registerType(type: string) {
  if (!types.add(type)) {
    console.log(type);
  }
}

interface XanifyOptions {
  pagesPath?: string;
}

export default function (options: XanifyOptions): Plugin {
  return {
    name: 'xania-ssr',
    configureServer(vite) {
      const pagesPath = '/' + (options?.pagesPath ?? 'pages');

      console.log(
        'SSR scripts will be resolved from: ' +
          kleur.gray(vite.config.root) +
          kleur.green(pagesPath)
      );

      const routeResoler = new FileRouteResolver(vite.config.root, pagesPath);

      vite.middlewares.use(async (req, res, next) => {
        if (req.headers.accept?.includes('text/html')) {
          const pageUrl = await routeResoler.resolvePath(req.url);
          if (pageUrl) console.log(pageUrl);

          if (pageUrl) {
            try {
              const page = await vite.ssrLoadModule(pageUrl);

              if (page?.view instanceof Function) {
                let responseHtml = '';
                await page.view(
                  req,
                  {
                    write(s: string) {
                      responseHtml += s;
                    },
                    async end(data) {
                      if (data) {
                        responseHtml += data;
                      }

                      const transformedHtml = await vite.transformIndexHtml(
                        req.url,
                        responseHtml
                      );

                      res.end(transformedHtml);
                    },
                  },
                  next
                );
                return res;
              } else {
                console.warn(
                  kleur.yellow(
                    `page as '${pageUrl}' does not define view handler`
                  )
                );
              }
            } catch (err) {
              console.log(kleur.red(err));
            }
          }
        }
        return next();
      });
      vite.middlewares;
    },
    transform(code, id, options) {
      if (id.endsWith('.tsx') && options?.ssr == true) {
        if (!options.ssr) console.log(id, options);

        const ast = this.parse(code);
        walk(ast, {
          enter(node: any, parent, prop, index) {
            // some code happens
            if (node.type === 'ExportNamedDeclaration') {
              console.log(id, node?.declaration?.id?.name);
            }
            // if (node.type === "CallExpression") {
            //   const call = node as CallExpression;
            //   const callee = call.callee as MemberExpression;
            //   const object = callee?.object as Identifier;
            //   if (object?.name === "jsx") {
            //     console.log(node);
            //   }
            // }
          },
          leave(node, parent, prop, index) {
            // some code happens
          },
        });

        return { ast };
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
