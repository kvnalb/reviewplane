#!/usr/bin/env node
import { access, cp, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

type Result = { changed: string[]; notes: string[] }
const run = promisify(execFile)
const START = '<!-- reviewplane:start -->'
const END = '<!-- reviewplane:end -->'
const AGENT_BLOCK = `${START}\n## ReviewPlane\n\nFor visual review batches, read \`.agents/skills/reviewplane-adopt-react/SKILL.md\`. Keep the runtime development-only and acknowledge applied, unresolved, and failed corrections separately.\n${END}`
const BOOTSTRAP = `import { createRoot } from 'react-dom/client'\nimport { ReviewPlane, registerReviewPlaneTools } from '@reviewplane/react'\n\nconst host = document.createElement('div')\nhost.dataset.reviewplaneRoot = ''\ndocument.body.append(host)\ncreateRoot(host).render(<ReviewPlane />)\n\nif (document.modelContext) void registerReviewPlaneTools(document.modelContext)\n`

async function exists(file: string) { try { await access(file, constants.F_OK); return true } catch { return false } }
async function json(file: string) { return JSON.parse(await readFile(file, 'utf8')) as Record<string, any> }
async function writeIfChanged(file: string, content: string, dryRun: boolean, result: Result, root = process.cwd()) {
  const current = await exists(file) ? await readFile(file, 'utf8') : null
  if (current === content) return
  result.changed.push(path.relative(root, file))
  if (!dryRun) { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, content) }
}

export function detectPackageManager(root: string, files: string[]) {
  if (files.includes('pnpm-lock.yaml')) return 'pnpm'
  if (files.includes('yarn.lock')) return 'yarn'
  if (files.includes('bun.lock') || files.includes('bun.lockb')) return 'bun'
  return 'npm'
}

export function updateViteConfig(source: string) {
  if (source.includes('@reviewplane/vite') || source.includes('reviewplane(')) return { supported: true, source }
  const plugins = /plugins\s*:\s*\[([^\]]*)\]/s
  if (!plugins.test(source) || !source.includes('defineConfig')) return { supported: false, source }
  const importLine = `import reviewplane from '@reviewplane/vite'\n`
  const next = importLine + source.replace(plugins, (_match, contents: string) => `plugins: [reviewplane(),${contents}]`)
  return { supported: true, source: next }
}

export async function initProject(root: string, dryRun = false): Promise<Result> {
  const result: Result = { changed: [], notes: [] }
  const packageFile = path.join(root, 'package.json')
  if (!await exists(packageFile)) throw new Error('No package.json found in this directory.')
  const manifest = await json(packageFile)
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  if (!dependencies.react || !dependencies.vite) throw new Error('ReviewPlane init requires a React + Vite project.')
  const files = await readdir(root)
  const manager = detectPackageManager(root, files)
  if (!dependencies['@reviewplane/react'] || !dependencies['@reviewplane/vite']) {
    const install = manager === 'npm'
      ? { command: 'npm', args: ['install', '--save-dev', '@reviewplane/react', '@reviewplane/vite'] }
      : { command: manager, args: ['add', manager === 'bun' ? '--dev' : '-D', '@reviewplane/react', '@reviewplane/vite'] }
    if (dryRun) result.notes.push(`Would install SDK packages: ${install.command} ${install.args.join(' ')}`)
    else {
      result.notes.push('Installing the ReviewPlane SDK packages…')
      try { await run(install.command, install.args, { cwd: root }) }
      catch { throw new Error(`Package installation failed. Run this command, then retry init: ${install.command} ${install.args.join(' ')}`) }
    }
  }
  const configName = ['vite.config.ts', 'vite.config.js', 'vite.config.mts', 'vite.config.mjs'].find((name) => files.includes(name))
  if (!configName) result.notes.push("Manual setup: import reviewplane from '@reviewplane/vite' and add reviewplane() before react() in the Vite plugins array.")
  else {
    const configFile = path.join(root, configName)
    const updated = updateViteConfig(await readFile(configFile, 'utf8'))
    if (updated.supported) await writeIfChanged(configFile, updated.source, dryRun, result, root)
    else result.notes.push(`Manual setup required for ${configName}: add reviewplane() before the React plugin. Its configuration shape was not rewritten.`)
  }
  await writeIfChanged(path.join(root, 'src', 'reviewplane-dev.tsx'), BOOTSTRAP, dryRun, result, root)
  const mainName = await exists(path.join(root, 'src/main.tsx'))
    ? 'src/main.tsx'
    : await exists(path.join(root, 'src/main.jsx')) ? 'src/main.jsx' : null
  if (mainName) {
    const mainFile = path.join(root, mainName)
    const current = await readFile(mainFile, 'utf8')
    if (!current.includes("import('./reviewplane-dev')")) await writeIfChanged(mainFile, `${current.trimEnd()}\n\nif (import.meta.env.DEV) void import('./reviewplane-dev')\n`, dryRun, result, root)
  } else result.notes.push("Manual setup: add `if (import.meta.env.DEV) void import('./reviewplane-dev')` to the React entry file.")
  const template = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../templates/reviewplane-adopt-react')
  const skillTarget = path.join(root, '.agents/skills/reviewplane-adopt-react')
  if (!await exists(path.join(skillTarget, 'SKILL.md'))) {
    result.changed.push(path.relative(root, path.join(skillTarget, 'SKILL.md')))
    if (!dryRun) { await mkdir(path.dirname(skillTarget), { recursive: true }); await cp(template, skillTarget, { recursive: true }) }
  }
  const agentsFile = path.join(root, 'AGENTS.md')
  const agents = await exists(agentsFile) ? await readFile(agentsFile, 'utf8') : ''
  if (!agents.includes(START)) await writeIfChanged(agentsFile, `${agents.trimEnd()}${agents.trim() ? '\n\n' : ''}${AGENT_BLOCK}\n`, dryRun, result, root)
  result.notes.push(dryRun ? 'Dry run only; no files were written.' : result.changed.length ? 'ReviewPlane initialization complete.' : 'ReviewPlane is already initialized.')
  return result
}

async function scanFiles(directory: string): Promise<string[]> {
  if (!await exists(directory)) return []
  const output: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) output.push(...await scanFiles(target))
    else if (/\.[jt]sx?$/.test(entry.name)) output.push(target)
  }
  return output
}

export async function checkProject(root: string, url?: string) {
  const manifest = await json(path.join(root, 'package.json'))
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies }
  const files = await readdir(root)
  const configName = files.find((name) => /^vite\.config\.(ts|js|mts|mjs)$/.test(name))
  const config = configName ? await readFile(path.join(root, configName), 'utf8') : ''
  const sourceFiles = await scanFiles(path.join(root, 'src'))
  const sources = await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))
  const distFiles = await scanFiles(path.join(root, 'dist'))
  const dist = await Promise.all(distFiles.map((file) => readFile(file, 'utf8')))
  let coverage = 'unknown (start Vite and pass --url)'
  if (url) {
    try { const data = await fetch(new URL('/__reviewplane/manifest.json', url)) as Response; const body = await data.json() as { records?: unknown[] }; coverage = `${body.records?.length ?? 0} mapped source elements` } catch { coverage = 'unavailable at supplied URL' }
  }
  return {
    react: Boolean(dependencies.react), vite: Boolean(dependencies.vite),
    vitePlugin: config.includes('@reviewplane/vite') && config.includes('reviewplane('),
    overlay: sources.some((source) => source.includes('@reviewplane/react') && source.includes('ReviewPlane')),
    webmcp: sources.some((source) => source.includes('registerReviewPlaneTools')),
    sourceManifestCoverage: coverage,
    unsupportedDynamicContent: sources.filter((source) => source.includes('dangerouslySetInnerHTML')).length,
    canvasRenderedContent: sources.filter((source) => /<canvas\b/.test(source)).length,
    externallyOwnedContent: sources.filter((source) => /\b(fetch|axios\.|useTranslation|\bt\()/.test(source)).length,
    staleMappings: 'runtime-only; shown by the correction tray',
    productionBundleExcluded: !dist.some((source) => /data-rp-source-id|reviewplane-preview-styles|wait_for_review/.test(source)),
  }
}

function printInit(result: Result) {
  console.log(result.changed.length ? 'ReviewPlane is set up.' : 'ReviewPlane is already set up.')
  for (const file of result.changed) console.log(`  changed ${file}`)
  for (const note of result.notes) console.log(`  ${note}`)
}

function printCheck(report: Awaited<ReturnType<typeof checkProject>>) {
  const checks = [
    [report.react, 'React app found', 'React was not found in package.json.'],
    [report.vite, 'Vite app found', 'Vite was not found in package.json.'],
    [report.vitePlugin, 'Page-to-code mapping is configured', 'Add reviewplane() before the React plugin in vite.config.'],
    [report.overlay, 'Visual review overlay is installed', 'Run npx reviewplane init to add the review overlay.'],
    [report.webmcp, 'Agent handoff is installed', 'Run npx reviewplane init to add agent handoff.'],
    [report.productionBundleExcluded, 'Production build is clean', 'ReviewPlane development code appeared in dist. Keep its import behind import.meta.env.DEV.'],
  ] as const
  console.log(checks.every(([passed]) => passed) ? 'ReviewPlane is ready.' : 'ReviewPlane needs attention.')
  for (const [passed, yes, no] of checks) console.log(`${passed ? '✓' : '!'} ${passed ? yes : no}`)
  console.log(`• Page coverage: ${report.sourceManifestCoverage}`)
  if (report.unsupportedDynamicContent) console.log(`! ${report.unsupportedDynamicContent} file(s) inject HTML directly, so text inside them cannot be selected reliably.`)
  if (report.canvasRenderedContent) console.log(`! ${report.canvasRenderedContent} file(s) draw on canvas, so that content cannot be selected.`)
  if (report.externallyOwnedContent) console.log(`! ${report.externallyOwnedContent} file(s) may load copy from an API or translation file. Your agent will trace the real owner before editing.`)
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  const rootArg = args.find((arg) => arg.startsWith('--root='))?.slice(7)
  const root = path.resolve(rootArg ?? process.cwd())
  if (command === 'init') printInit(await initProject(root, args.includes('--dry-run')))
  else if (command === 'check') {
    const report = await checkProject(root, args.find((arg) => arg.startsWith('--url='))?.slice(6))
    if (args.includes('--json')) console.log(JSON.stringify(report, null, 2))
    else printCheck(report)
  }
  else { console.error('Usage: reviewplane <init|check> [--dry-run] [--root=path] [--url=http://localhost:5173]'); process.exitCode = 1 }
}

if (process.argv[1]) void realpath(process.argv[1]).then((entry) => {
  if (entry === fileURLToPath(import.meta.url)) return main()
}).catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
