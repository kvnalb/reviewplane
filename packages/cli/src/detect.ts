import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { DetectedProject, PackageManager } from './types.ts'

function readJson(path: string): Record<string, unknown> | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

function hasDependency(pkg: Record<string, unknown>, name: string) {
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
    const block = pkg[field]
    if (block && typeof block === 'object' && name in (block as Record<string, unknown>)) return true
  }
  return false
}

export function detectPackageManager(root: string): PackageManager {
  if (existsSync(join(root, 'bun.lockb')) || existsSync(join(root, 'bun.lock'))) return 'bun'
  if (existsSync(join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(join(root, 'yarn.lock'))) return 'yarn'
  return 'npm'
}

function findFirst(root: string, candidates: string[]) {
  return candidates.map((name) => join(root, name)).find((path) => existsSync(path)) ?? null
}

export function detectProject(cwd = process.cwd()): DetectedProject {
  const root = cwd
  const packageJsonPath = join(root, 'package.json')
  const pkg = readJson(packageJsonPath) ?? {}
  const viteConfigPath = findFirst(root, [
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.cts',
    'vite.config.cjs',
  ])
  const entryPath = findFirst(root, [
    'src/main.tsx',
    'src/main.jsx',
    'src/main.ts',
    'src/main.js',
    'src/index.tsx',
    'src/index.jsx',
  ])

  return {
    root,
    packageManager: detectPackageManager(root),
    hasReact: hasDependency(pkg, 'react'),
    hasVite: hasDependency(pkg, 'vite') || Boolean(viteConfigPath),
    viteConfigPath,
    entryPath,
    packageJsonPath,
  }
}

export function installCommand(manager: PackageManager, packages: string[]) {
  const list = packages.join(' ')
  switch (manager) {
    case 'pnpm':
      return `pnpm add -D ${list}`
    case 'yarn':
      return `yarn add -D ${list}`
    case 'bun':
      return `bun add -d ${list}`
    default:
      return `npm install -D ${list}`
  }
}

export function listFiles(root: string, relativeDir: string) {
  const absolute = join(root, relativeDir)
  if (!existsSync(absolute)) return []
  return readdirSync(absolute)
}
