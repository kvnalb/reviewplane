import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { detectProject } from './detect.ts'
import type { CheckFinding, CheckResult } from './types.ts'

function readJson(path: string) {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function hasDep(pkg: Record<string, unknown> | null, name: string) {
  if (!pkg) return false
  for (const field of ['dependencies', 'devDependencies'] as const) {
    const block = pkg[field]
    if (block && typeof block === 'object' && name in (block as object)) return true
  }
  return false
}

export async function checkReviewPlane(cwd = process.cwd()): Promise<CheckResult> {
  const project = detectProject(cwd)
  const findings: CheckFinding[] = []
  const pkg = readJson(project.packageJsonPath)

  findings.push({
    id: 'react',
    level: project.hasReact ? 'ok' : 'fail',
    title: 'React',
    detail: project.hasReact ? 'React is listed in package.json.' : 'React was not found. ReviewPlane supports React apps only.',
  })

  findings.push({
    id: 'vite',
    level: project.hasVite ? 'ok' : 'fail',
    title: 'Vite',
    detail: project.hasVite ? 'Vite is present.' : 'Vite was not detected.',
  })

  const hasPluginPackage = hasDep(pkg, '@reviewplane/vite')
  const viteConfigured = project.viteConfigPath
    ? readFileSync(project.viteConfigPath, 'utf8').includes('@reviewplane/vite')
    : false

  findings.push({
    id: 'vite-plugin',
    level: hasPluginPackage && viteConfigured ? 'ok' : hasPluginPackage || viteConfigured ? 'warn' : 'fail',
    title: 'Vite plugin',
    detail: hasPluginPackage && viteConfigured
      ? 'ReviewPlane Vite plugin is installed and referenced.'
      : 'Install @reviewplane/vite and add reviewplane() before your React plugin.',
  })

  const hasOverlayPackage = hasDep(pkg, '@reviewplane/react')
  const entryConfigured = project.entryPath
    ? /@reviewplane\/react|<ReviewPlane/.test(readFileSync(project.entryPath, 'utf8'))
    : false

  findings.push({
    id: 'overlay',
    level: hasOverlayPackage && entryConfigured ? 'ok' : 'warn',
    title: 'Overlay mount',
    detail: hasOverlayPackage && entryConfigured
      ? 'Overlay package is installed and mounted from the app entry.'
      : 'Mount <ReviewPlane /> behind import.meta.env.DEV after installing @reviewplane/react.',
  })

  findings.push({
    id: 'webmcp',
    level: 'info',
    title: 'WebMCP',
    detail: 'WebMCP is a browser capability. In Chrome, enable the WebMCP testing flag and confirm document.modelContext exists while reviewing.',
  })

  findings.push({
    id: 'manifest',
    level: 'info',
    title: 'Source mapping',
    detail: 'With the dev server running, open /__reviewplane/manifest.json. Mapped elements should include data-rp-source-id attributes.',
  })

  findings.push({
    id: 'dynamic-content',
    level: 'info',
    title: 'Unsupported dynamic content',
    detail: 'Canvas text, cross-origin iframes, and dangerouslySetInnerHTML content cannot receive ordinary DOM text mapping.',
  })

  findings.push({
    id: 'external-content',
    level: 'info',
    title: 'Externally owned content',
    detail: 'CMS/API-owned strings may map to a rendered element while the durable source lives outside the repo. The coding agent should leave those unresolved when no local owner exists.',
  })

  findings.push({
    id: 'stale-mappings',
    level: 'info',
    title: 'Stale mappings',
    detail: 'If React rerenders replace previewed text and the fingerprint no longer matches, ReviewPlane marks the correction stale instead of guessing.',
  })

  const prodScripts = JSON.stringify(pkg?.scripts ?? {})
  findings.push({
    id: 'production-exclusion',
    level: /build/.test(prodScripts) ? 'ok' : 'warn',
    title: 'Production exclusion',
    detail: 'Ordinary production builds should omit ReviewPlane. Prefer import.meta.env.DEV mounts and the Vite plugin apply: "serve" default. Hosted sandbox is a separate explicit mode.',
  })

  const createSkill = existsSync(join(cwd, '.agents/skills/reviewplane-create-react/SKILL.md'))
  const adoptSkill = existsSync(join(cwd, '.agents/skills/reviewplane-adopt-react/SKILL.md'))
  findings.push({
    id: 'skills',
    level: createSkill && adoptSkill ? 'ok' : 'warn',
    title: 'Agent skills',
    detail: createSkill && adoptSkill
      ? 'Create and adopt skills are installed under .agents/skills.'
      : 'Run reviewplane init to install the ReviewPlane skills.',
  })

  const ok = findings.every((finding) => finding.level !== 'fail')
  return { ok, findings }
}
