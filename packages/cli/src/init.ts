import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectProject, installCommand } from './detect.ts'
import { agentsSnippet, patchEntry, patchViteConfig } from './patch.ts'
import type { InitChange, InitOptions, InitResult } from './types.ts'

const PACKAGE_NAMES = ['@reviewplane/react', '@reviewplane/vite'] as const

function templatesRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'templates')
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true })
}

function writeText(path: string, contents: string, dryRun: boolean, changes: InitChange[], detail: string) {
  if (existsSync(path) && readFileSync(path, 'utf8') === contents) {
    changes.push({ path, action: 'skip', detail: `${detail} (unchanged)` })
    return
  }
  changes.push({ path, action: existsSync(path) ? 'update' : 'create', detail })
  if (!dryRun) {
    ensureDir(dirname(path))
    writeFileSync(path, contents, 'utf8')
  }
}

function copySkill(name: string, targetRoot: string, dryRun: boolean, changes: InitChange[]) {
  const from = join(templatesRoot(), 'skills', name)
  const to = join(targetRoot, '.agents', 'skills', name)
  if (!existsSync(from)) {
    changes.push({ path: to, action: 'manual', detail: `Missing packaged skill template ${name}` })
    return
  }
  changes.push({ path: to, action: existsSync(to) ? 'update' : 'create', detail: `Install ${name} skill` })
  if (!dryRun) {
    ensureDir(dirname(to))
    cpSync(from, to, { recursive: true })
  }
}

export async function initReviewPlane(options: InitOptions = {}): Promise<InitResult> {
  const dryRun = Boolean(options.dryRun)
  const cwd = options.cwd ?? process.cwd()
  const project = detectProject(cwd)
  const changes: InitChange[] = []
  const manualSteps: string[] = []

  if (!existsSync(project.packageJsonPath)) {
    return {
      ok: false,
      dryRun,
      project,
      changes,
      installCommand: null,
      manualSteps: ['Run this command inside a React + Vite project that already has package.json.'],
      message: 'No package.json found.',
    }
  }

  if (!project.hasReact || !project.hasVite) {
    return {
      ok: false,
      dryRun,
      project,
      changes,
      installCommand: null,
      manualSteps: [
        'Install React and Vite first, then rerun `reviewplane init`.',
        'ReviewPlane currently supports React + Vite apps only.',
      ],
      message: 'React + Vite were not detected.',
    }
  }

  const install = installCommand(project.packageManager, [...PACKAGE_NAMES])
  changes.push({
    path: project.packageJsonPath,
    action: 'update',
    detail: `Add ${PACKAGE_NAMES.join(' and ')} as development dependencies`,
  })

  if (project.viteConfigPath) {
    const original = readFileSync(project.viteConfigPath, 'utf8')
    const patched = patchViteConfig(original)
    if (patched.status === 'manual') {
      changes.push({ path: project.viteConfigPath, action: 'manual', detail: patched.reason })
      manualSteps.push(
        `In ${project.viteConfigPath}, import reviewplane from '@reviewplane/vite' and put reviewplane() before your React plugin.`,
      )
    } else if (patched.status === 'unchanged') {
      changes.push({ path: project.viteConfigPath, action: 'skip', detail: 'Vite plugin already configured' })
    } else {
      writeText(project.viteConfigPath, patched.code, dryRun, changes, 'Configure ReviewPlane Vite plugin')
    }
  } else {
    manualSteps.push('Create a vite.config and add reviewplane() before your React plugin.')
    changes.push({ path: join(cwd, 'vite.config.ts'), action: 'manual', detail: 'No vite.config found' })
  }

  if (project.entryPath) {
    const original = readFileSync(project.entryPath, 'utf8')
    const patched = patchEntry(original, project.entryPath)
    if (patched.status === 'unchanged') {
      changes.push({ path: project.entryPath, action: 'skip', detail: 'Overlay mount already present' })
    } else {
      writeText(project.entryPath, patched.code, dryRun, changes, 'Mount ReviewPlane overlay in development')
    }
  } else {
    manualSteps.push('Mount `<ReviewPlane />` from `@reviewplane/react` behind `import.meta.env.DEV` in your root entry.')
    changes.push({ path: join(cwd, 'src/main.tsx'), action: 'manual', detail: 'No entry file found' })
  }

  copySkill('reviewplane-create-react', cwd, dryRun, changes)
  copySkill('reviewplane-adopt-react', cwd, dryRun, changes)

  const viteEnvPath = join(cwd, 'src/vite-env.d.ts')
  if (!existsSync(viteEnvPath)) {
    writeText(
      viteEnvPath,
      `/// <reference types="vite/client" />\n`,
      dryRun,
      changes,
      'Add Vite client types for import.meta.env',
    )
  } else {
    changes.push({ path: viteEnvPath, action: 'skip', detail: 'Vite client types already present' })
  }

  const agentsPath = join(cwd, 'AGENTS.md')
  if (existsSync(agentsPath)) {
    const current = readFileSync(agentsPath, 'utf8')
    if (current.includes('## ReviewPlane')) {
      changes.push({ path: agentsPath, action: 'skip', detail: 'AGENTS.md already mentions ReviewPlane' })
    } else {
      writeText(agentsPath, `${current.trimEnd()}\n\n${agentsSnippet()}`, dryRun, changes, 'Append ReviewPlane guidance to AGENTS.md')
    }
  } else {
    writeText(agentsPath, `# Agent instructions\n\n${agentsSnippet()}`, dryRun, changes, 'Create AGENTS.md with ReviewPlane guidance')
  }

  if (!dryRun && !options.skipInstall) {
    const { spawnSync } = await import('node:child_process')
    const result = spawnSync(install, {
      cwd,
      shell: true,
      stdio: 'inherit',
      env: process.env,
    })
    if (result.status !== 0) {
      return {
        ok: false,
        dryRun,
        project,
        changes,
        installCommand: install,
        manualSteps: [...manualSteps, `Install failed. Run: ${install}`],
        message: 'Package installation failed.',
      }
    }
  } else {
    manualSteps.unshift(`Install packages: ${install}`)
  }

  const failed = changes.some((change) => change.action === 'manual') && !project.viteConfigPath
  return {
    ok: !failed && project.hasReact && project.hasVite,
    dryRun,
    project,
    changes,
    installCommand: install,
    manualSteps,
    message: dryRun
      ? 'Dry run complete. Re-run without --dry-run to apply.'
      : 'ReviewPlane is ready. Start the Vite dev server and open the page to review.',
  }
}
