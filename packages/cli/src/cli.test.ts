import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkProject, detectPackageManager, initProject, updateViteConfig } from './cli.js'

async function fixture(withSdk = true) {
  const root = await mkdtemp(path.join(tmpdir(), 'reviewplane-cli-'))
  await mkdir(path.join(root, 'src'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { react: '^19' }, devDependencies: { vite: '^8', ...(withSdk ? { '@reviewplane/react': '*', '@reviewplane/vite': '*' } : {}) } }))
  await writeFile(path.join(root, 'vite.config.ts'), "import react from '@vitejs/plugin-react'\nimport { defineConfig } from 'vite'\nexport default defineConfig({ plugins: [react()] })\n")
  await writeFile(path.join(root, 'src/main.tsx'), "import { createRoot } from 'react-dom/client'\ncreateRoot(document.getElementById('root')!).render(null)\n")
  return root
}

describe('reviewplane CLI', () => {
  it('detects package managers and refuses unknown Vite shapes', () => {
    expect(detectPackageManager('.', ['pnpm-lock.yaml'])).toBe('pnpm')
    expect(updateViteConfig('export default {}').supported).toBe(false)
  })
  it('supports dry-run and initializes a standard Vite app idempotently', async () => {
    const root = await fixture()
    const dry = await initProject(root, true)
    expect(dry.changed).toContain('vite.config.ts')
    expect(await readFile(path.join(root, 'vite.config.ts'), 'utf8')).not.toContain('@reviewplane/vite')
    const first = await initProject(root)
    expect(first.changed).toContain('src/reviewplane-dev.tsx')
    const second = await initProject(root)
    expect(second.changed).toEqual([])
    const report = await checkProject(root)
    expect(report).toMatchObject({ react: true, vite: true, vitePlugin: true, overlay: true, webmcp: true, productionBundleExcluded: true })
  })
  it('plans package installation without changing a dry-run project', async () => {
    const root = await fixture(false)
    const result = await initProject(root, true)
    expect(result.notes).toContain('Would install SDK packages: npm install --save-dev @reviewplane/react @reviewplane/vite')
    expect(JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).devDependencies).toEqual({ vite: '^8' })
  })
})
