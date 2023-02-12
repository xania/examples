import path from 'node:path';
import type { SourceMap } from 'rollup';

import type { ViteDevServer } from 'vite';
import { transform } from '../../resumable/lib/transform';
import { _getCombinedSourcemap } from './combine-sourcemaps';
/* use page module because we want to transform source code to resumable script just for the entry file and it's dependencies
 * We also dont want this transform to has effect when same source code is loaded
 */

const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;

const ssrModuleExportsKey = `__vite_ssr_exports__`;
const ssrImportKey = `__vite_ssr_import__`;
const ssrDynamicImportKey = `__vite_ssr_dynamic_import__`;
const ssrExportAllKey = `__vite_ssr_exportAll__`;
const ssrImportMetaKey = `__vite_ssr_import_meta__`;
const NULL_BYTE_PLACEHOLDER = `__x00__`;
const VALID_ID_PREFIX = `/@id/`;
const AsyncFunction = async function () {}.constructor as any;
let fnDeclarationLineCount = 0;
{
  const body = '/*code*/';
  const source = new AsyncFunction('a', 'b', body).toString();
  fnDeclarationLineCount =
    source.slice(0, source.indexOf(body)).split('\n').length - 1;
}

function loadModule(
  vite: ViteDevServer,
  load: (
    url: string,
    mod: Record<string, any>
  ) => Promise<Record<string, any> | null>
) {
  const loadCache = new Map<string, Promise<Record<string, any> | null>>();
  const moduleCache = new Map<string, Record<string, any>>();

  const loadstack: string[] = [];
  function moduleLoader(url: string) {
    if (loadstack.includes(url)) {
      // cyclic, return possibly non initialized module and brace for impact
      return Promise.resolve(moduleCache.get(url));
    }

    if (loadCache.has(url)) {
      return loadCache.get(url)!;
    }

    if (CSS_LANGS_RE.test(url)) {
      return vite.ssrLoadModule(url);
    }

    const ssrModule: Record<string, any> = {
      [Symbol.toStringTag]: 'Module',
    };
    moduleCache.set(url, ssrModule);

    loadstack.push(url);
    const promise = load(url, ssrModule);

    promise.then((m) => {
      const end = loadstack.pop()!;
      if (url !== end || m !== ssrModule) {
        debugger;
      }
    });

    loadCache.set(url, promise);
    return promise;
  }

  return moduleLoader;
}

export function createLoader(server: ViteDevServer) {
  const loadResumableModule = loadModule(
    server,
    async (url: string, ssrModule: Record<string, any>) => {
      const resumeResult = await loadAndTransform(url);
      if (!resumeResult) return null;

      const filename = resumeResult.file;

      const sourcemapChain: SourceMap[] = [];

      if (resumeResult.map) {
        sourcemapChain.push(resumeResult.map);
      }

      const ssrResult = await server.ssrTransform(
        resumeResult.code,
        resumeResult.map,
        url
      );
      if (!ssrResult) return null;

      if (ssrResult.map) {
        sourcemapChain.push(ssrResult.map);
      }

      const ssrImport = (dep: string) => {
        if (dep[0] !== '.' && dep[0] !== '/') {
          throw new Error(
            'node module is not supported in a resumable context ' + dep
          );
        }

        if (dep.startsWith('/@resumable')) {
          return loadResumableModule(dep.substring('/@resumable'.length));
        }

        return loadResumableModule(unwrapId(dep));
      };
      const ssrDynamicImport = (dep: string) => {
        // #3087 dynamic import vars is ignored at rewrite import path,
        // so here need process relative path
        if (dep[0] === '.') {
          dep = path.posix.resolve(path.dirname(url), dep);
        }
        return ssrImport(dep);
      };
      function ssrExportAll(sourceModule: any) {
        for (const key in sourceModule) {
          if (key !== 'default') {
            Object.defineProperty(ssrModule, key, {
              enumerable: true,
              configurable: true,
              get() {
                return sourceModule[key];
              },
            });
          }
        }
      }

      let sourceMapSuffix = '';

      const map = _getCombinedSourcemap(filename, sourcemapChain); // combineSourcemaps(filename, sourcemapChain as any, false);

      if (map) {
        const moduleSourceMap = Object.assign({}, map, {
          // currently we need to offset the line
          // https://github.com/nodejs/node/issues/43047#issuecomment-1180632750
          mappings: ';'.repeat(fnDeclarationLineCount) + map.mappings,
        });
        sourceMapSuffix =
          '\n//# sourceMappingURL=' + genSourceMapUrl(moduleSourceMap);
      }

      const initModule = new AsyncFunction(
        `global`,
        ssrModuleExportsKey,
        ssrImportMetaKey,
        ssrImportKey,
        ssrDynamicImportKey,
        ssrExportAllKey,
        '"use strict";' +
          ssrResult.code +
          `\n//# sourceURL=${filename}${sourceMapSuffix}`
      );
      const ssrImportMeta = {
        url,
      };

      await initModule(
        { global },
        ssrModule,
        ssrImportMeta,
        ssrImport,
        ssrDynamicImport,
        ssrExportAll
      );
      // } catch (e) {
      //   // if (e.stack && fixStacktrace) {
      //   //   ssrFixStacktrace(e, moduleGraph);
      //   //   server.config.logger.error(
      //   //     `Error when evaluating SSR module ${url}:\n${e.stack}`,
      //   //     {
      //   //       timestamp: true,
      //   //       clear: server.config.clearScreen,
      //   //       error: e,
      //   //     }
      //   //   );
      //   // }
      //   throw e;
      // }
      return ssrModule;
    }
  );

  async function loadAndTransform(url: string) {
    const resolved = await server.pluginContainer.resolveId(url);
    if (!resolved) {
      return null;
    }
    const filename = resolved.id;

    const baseResult = await server.transformRequest(filename);

    if (!baseResult) return null;

    const sourcemapChain: SourceMap[] = [];
    if (baseResult.map) {
      sourcemapChain.push(baseResult.map);
    }

    const resumeResult = transform(baseResult.code, {});

    if (!resumeResult) return null;
    sourcemapChain.push(resumeResult.map);

    return {
      code: resumeResult.code,
      file: filename,
      map: _getCombinedSourcemap(filename, sourcemapChain),
      genSourceMap() {
        const { map } = this;
        return (
          `\n//# sourceURL=${filename}\n//# sourceMappingURL=` +
          genSourceMapUrl(map)
        );
      },
    };
  }

  return {
    loadResumableModule,
    loadAndTransform,
  };
}

function unwrapId(id: string) {
  return id.startsWith(VALID_ID_PREFIX)
    ? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, '\0')
    : id;
}

function genSourceMapUrl(map: any) {
  if (typeof map !== 'string') {
    map = JSON.stringify(map);
  }
  return `data:application/json;base64,${Buffer.from(map).toString('base64')}`;
}

// function combineSourceMapChain(url: string, chain: SourceMap[]) {
//   if (chain.length === 0) return null;
//   let retval = chain[0];

//   for(let i=1 ; i<chain.length ; i++ ){
//     const inMap = chain[i];

//     if (inMap && inMap.mappings && inMap.sources.length > 0) {
//       retval = combineSourcemaps(
//         url,
//         [
//           {
//             ...retval,
//             sources: inMap.sources,
//             sourcesContent: inMap.sourcesContent,
//           },
//           inMap,
//         ],
//         false,
//         ) as SourceMap
//       }
//     }

// }
