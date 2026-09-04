import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const repoRoot = join(import.meta.dirname, '../../..')
const packDir = mkdtempSync(join(tmpdir(), 'reviewplane-packs-'))
const appDir = mkdtempSync(join(tmpdir(), 'reviewplane-external-'))

function run(command: string, cwd: string, env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(command, { cwd, shell: true, encoding: 'utf8', env })
  if (result.status !== 0) {
    throw new Error(`${command}\n${result.stdout}\n${result.stderr}`)
  }
  return result.stdout
}

beforeAll(() => {
  run('npm run build:packages', repoRoot)
  mkdirSync(packDir, { recursive: true })
  run(`npm pack --workspace @reviewplane/core --workspace @reviewplane/vite --workspace @reviewplane/react --workspace reviewplane --pack-destination ${packDir}`, repoRoot)

  run('npm create vite@latest external-app -- --template react-ts', appDir)
  const project = join(appDir, 'external-app')
  const tarballs = {
    core: join(packDir, 'reviewplane-core-0.1.0.tgz'),
    vite: join(packDir, 'reviewplane-vite-0.1.0.tgz'),
    react: join(packDir, 'reviewplane-react-0.1.0.tgz'),
    cli: join(packDir, 'reviewplane-0.1.0.tgz'),
  }
  for (const path of Object.values(tarballs)) {
    if (!existsSync(path)) throw new Error(`Missing tarball ${path}`)
  }
  run('npm install', project)
  run(`npm install -D ${tarballs.core} ${tarballs.vite} ${tarballs.react} ${tarballs.cli}`, project)
  run('npx reviewplane init --skip-install', project)
}, 300_000)

afterAll(() => {
  rmSync(packDir, { recursive: true, force: true })
  rmSync(appDir, { recursive: true, force: true })
})

describe('npm pack external smoke', () => {
  it('inits a clean Vite React app without hand-editing', () => {
    const project = join(appDir, 'external-app')
    const viteConfig = readFileSync(join(project, 'vite.config.ts'), 'utf8')
    const main = readFileSync(join(project, 'src/main.tsx'), 'utf8')
    expect(viteConfig).toContain('@reviewplane/vite')
    expect(viteConfig).toContain('reviewplane()')
    expect(main).toContain('@reviewplane/react')
    expect(main).toContain('<ReviewPlane')
    expect(existsSync(join(project, '.agents/skills/reviewplane-create-react/SKILL.md'))).toBe(true)
    expect(existsSync(join(project, 'AGENTS.md'))).toBe(true)
  })

  it('produces a production build without ReviewPlane markers', () => {
    const project = join(appDir, 'external-app')
    run('npm run build', project)
    const distJs = run('find dist -type f \\( -name "*.js" -o -name "*.css" -o -name "*.html" \\) | sort', project)
      .trim()
      .split('\n')
      .filter(Boolean)
    expect(distJs.length).toBeGreaterThan(0)
    for (const relative of distJs) {
      const contents = readFileSync(join(project, relative), 'utf8')
      expect(contents).not.toContain('data-rp-source-id')
      expect(contents).not.toContain('__reviewplane/manifest')
      expect(contents).not.toContain('wait_for_review')
      expect(contents).not.toMatch(/ReviewPlane/)
    }
  }, 180_000)
})
