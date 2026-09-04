#!/usr/bin/env node
/**
 * Pack ReviewPlane packages and prove one-command init on a clean disposable app.
 * Does not touch the user's demo landing page.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const packDir = mkdtempSync(join(tmpdir(), 'reviewplane-packs-'))
const appDir = mkdtempSync(join(tmpdir(), 'reviewplane-external-'))

function run(command, cwd, opts = {}) {
  console.log(`\n$ (${cwd}) ${command}`)
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf8',
    env: { ...process.env, PATH: process.env.PATH },
    ...opts,
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command}`)
  }
  return result.stdout ?? ''
}

try {
  run('npm run build:packages', repoRoot)
  run(`npm pack --workspace @reviewplane/core --workspace @reviewplane/vite --workspace @reviewplane/react --workspace reviewplane --pack-destination ${packDir}`, repoRoot)

  const fixture = join(repoRoot, 'tests/fixtures/vite-react')
  cpSync(fixture, appDir, { recursive: true })

  // Point the disposable app at packed tarballs without creating a fresh Vite scaffold online.
  const pkgPath = join(appDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.devDependencies = {
    ...pkg.devDependencies,
    '@reviewplane/core': `file:${join(packDir, 'reviewplane-core-0.1.0.tgz')}`,
    '@reviewplane/vite': `file:${join(packDir, 'reviewplane-vite-0.1.0.tgz')}`,
    '@reviewplane/react': `file:${join(packDir, 'reviewplane-react-0.1.0.tgz')}`,
    reviewplane: `file:${join(packDir, 'reviewplane-0.1.0.tgz')}`,
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

  run('npm install', appDir)
  run('npx reviewplane init --skip-install', appDir)

  const viteConfig = readFileSync(join(appDir, 'vite.config.ts'), 'utf8')
  const main = readFileSync(join(appDir, 'src/main.tsx'), 'utf8')
  if (!viteConfig.includes('reviewplane()')) throw new Error('vite.config missing reviewplane()')
  if (!main.includes('<ReviewPlane')) throw new Error('entry missing ReviewPlane mount')
  if (!existsSync(join(appDir, '.agents/skills/reviewplane-create-react/SKILL.md'))) {
    throw new Error('create skill missing')
  }

  run('npm run build', appDir)
  const distFiles = run('find dist -type f \\( -name "*.js" -o -name "*.css" -o -name "*.html" \\)', appDir)
    .trim()
    .split('\n')
    .filter(Boolean)
  for (const relative of distFiles) {
    const contents = readFileSync(join(appDir, relative), 'utf8')
    for (const needle of ['data-rp-source-id', '__reviewplane/manifest', 'wait_for_review']) {
      if (contents.includes(needle)) throw new Error(`Production artifact ${relative} contains ${needle}`)
    }
  }

  console.log('\nPACK SMOKE OK')
  console.log(`packs: ${packDir}`)
  console.log(`app: ${appDir}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  // Keep artifacts for debugging when FAIL; delete on success.
  if (process.exitCode) {
    console.error(`Left temp dirs for inspection:\n  ${packDir}\n  ${appDir}`)
  } else {
    rmSync(packDir, { recursive: true, force: true })
    rmSync(appDir, { recursive: true, force: true })
  }
}
