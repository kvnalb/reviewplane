import { normalizePath, type Plugin, type ResolvedConfig } from 'vite'
import { instrumentSource, shouldInstrument, type Exclusion, type SourceRecord } from './transform.js'
import { resolvedRuntimeModuleId, runtimeModuleId, runtimeSource } from './runtime.js'

export type ReviewPlaneViteOptions = {
  exclude?: Exclusion[]
  sandbox?: boolean
}

export type ReviewPlaneVitePlugin = Plugin & {
  api: {
    getManifest: () => SourceRecord[]
    getRevision: () => number
  }
}

const MANIFEST_PATH = '/__reviewplane/manifest.json'

export function reviewplane(options: ReviewPlaneViteOptions = {}): ReviewPlaneVitePlugin {
  let root = process.cwd()
  let revision = 0
  const recordsByFile = new Map<string, SourceRecord[]>()

  const currentManifest = () => [...recordsByFile.values()]
    .flat()
    .sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.column - right.column)

  const transformAndStore = (code: string, id: string) => {
    const file = normalizePath(id.split('?')[0])
    if (!shouldInstrument(id, code, { root, exclude: options.exclude })) {
      if (recordsByFile.delete(file)) revision += 1
      return null
    }
    const result = instrumentSource(code, id, { root, exclude: options.exclude })
    recordsByFile.set(file, result?.records ?? [])
    revision += 1
    return result
  }

  return {
    name: 'vite-plugin-reviewplane-react',
    enforce: 'pre',
    apply: (_config, environment) => environment.command === 'serve' || options.sandbox === true,
    api: { getManifest: currentManifest, getRevision: () => revision },
    configResolved(config: ResolvedConfig) {
      root = config.root
    },
    transform(code, id) {
      const result = transformAndStore(code, id)
      const map = result?.map ? JSON.parse(JSON.stringify(result.map)) : null
      return result ? { code: result.code, map } : null
    },
    async handleHotUpdate(context) {
      transformAndStore(await context.read(), context.file)
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== MANIFEST_PATH) return next()
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')
        response.end(JSON.stringify({ revision, records: currentManifest() }, null, 2))
      })
    },
    resolveId(id) {
      if (id === runtimeModuleId) return resolvedRuntimeModuleId
    },
    load(id) {
      if (id === resolvedRuntimeModuleId) return runtimeSource
    },
    transformIndexHtml() {
      return [{
        tag: 'script',
        attrs: { type: 'module', src: `/@id/__x00__${runtimeModuleId}` },
        injectTo: 'head-prepend',
      }]
    },
  }
}

export type { Exclusion, SourceRecord } from './transform.js'
export { instrumentSource, shouldInstrument } from './transform.js'
export default reviewplane
