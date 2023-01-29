import type { Plugin } from 'vite';
import { transform } from './transform';

export interface XaniaSsrOptions {
  pagesPath?: string;
  routes: Record<string, () => Promise<any>>;
  exists(file: string): Promise<boolean>;
}

export function XaniaSsrPlugin(options: XaniaSsrOptions): Plugin {
  return {
    name: 'xania-ssr',
    // configureServer(vite) {
    //   const pagesPath = '/' + (options?.pagesPath ?? 'pages');

    //   console.log(
    //     'SSR scripts will be resolved from: ' +
    //       kleur.gray(vite.config.root) +
    //       kleur.green(pagesPath)
    //   );

    //   const routeResoler = new FileRouteResolver(
    //     options.exists,
    //     vite.config.root,
    //     pagesPath
    //   );

    //   vite.middlewares.use(async (req, res, next) => {
    //     if (req.headers.accept?.includes('text/html')) {
    //       const reqUrl = req.url || '';
    //       const pageUrl = await routeResoler.resolvePage(reqUrl);

    //       if (pageUrl) {
    //         // console.log(pageUrl);
    //         try {
    //           const page = await vite.ssrLoadModule(pageUrl, {
    //             fixStacktrace: false,
    //           });

    //           if (page?.view instanceof Function) {
    //             let responseHtml = '';
    //             const result = page.view();

    //             await result.execute(
    //               req,
    //               {
    //                 write(s: string) {
    //                   responseHtml += s;
    //                 },
    //                 async end(data: any) {
    //                   if (data) {
    //                     responseHtml += data;
    //                   }

    //                   const transformedHtml = await vite.transformIndexHtml(
    //                     pageUrl,
    //                     responseHtml,
    //                     req.originalUrl
    //                   );

    //                   res.end(transformedHtml);
    //                 },
    //               } as any,
    //               next
    //             );
    //           } else {
    //             console.warn(
    //               kleur.yellow(
    //                 `page as '${pageUrl}' does not define view handler`
    //               )
    //             );
    //           }
    //         } catch (err: any) {
    //           console.log(kleur.red(err));
    //         }
    //       }
    //     }
    //     return next();
    //   });
    //   vite.middlewares;
    // },
    transform(code, id, options) {
      const match = id.match(/\.[tj]sx?$/);
      if (match) {
        // const names = match[1].split(',');
        return transform(code, { entry: 'view' }); // , (x) => names.includes(x));
        // }
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
