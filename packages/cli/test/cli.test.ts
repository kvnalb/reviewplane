import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkReviewPlane } from '../src/check.ts'
import { initReviewPlane } from '../src/init.ts'
import { patchEntry, patchViteConfig } from '../src/patch.ts'

const tempDirs: string[] = []

function tempProject(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'reviewplane-cli-'))
  tempDirs.push(root)
  for (const [relative, contents] of Object.entries(files)) {
    const absolute = join(root, relative)
    mkdirSync(join(absolute, '..'), { recursive: true })
    writeFileSync(absolute, contents)
  }
  return root
}

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop()
    if (dir) rmSync(dir, { recursive: true, force: true })
  }
})

describe('patchViteConfig', () => {
  it('inserts the plugin before existing plugins', () => {
    const source = `import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
})
`
    const result = patchViteConfig(source)
    expect(result.status).toBe('updated')
    if (result.status === 'updated') {
      expect(result.code).toContain("@reviewplane/vite")
      expect(result.code).toContain('reviewplane()')
      expect(result.code.indexOf('reviewplane()')).toBeLessThan(result.code.indexOf('react()'))
    }
  })

  it('is idempotent', () => {
    const source = `import reviewplane from '@reviewplane/vite'
export default { plugins: [reviewplane()] }
`
    expect(patchViteConfig(source).status).toBe('unchanged')
  })

  it('asks for manual setup on functional configs', () => {
    const source = `import { defineConfig } from 'vite'
export default defineConfig(({ mode }) => ({ plugins: [] }))
`
    expect(patchViteConfig(source).status).toBe('manual')
  })
})

describe('patchEntry', () => {
  it('wraps createRoot render with a development-only ReviewPlane mount', () => {
    const source = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`
    const result = patchEntry(source, 'src/main.tsx')
    expect(result.status).toBe('updated')
    expect(result.code).toContain("@reviewplane/react")
    expect(result.code).toContain('import.meta.env.DEV ? <ReviewPlane />')
  })
})

describe('initReviewPlane', () => {
  it('configures a standard Vite React app without install', async () => {
    const root = tempProject({
      'package.json': JSON.stringify({
        name: 'demo',
        private: true,
        type: 'module',
        dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
        devDependencies: { vite: '^8.0.0', '@vitejs/plugin-react': '^5.0.0' },
      }, null, 2),
      'vite.config.ts': `import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({ plugins: [react()] })
`,
      'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
      'src/App.tsx': `export default function App() { return <h1>Hello</h1> }\n`,
    })

    const result = await initReviewPlane({ cwd: root, dryRun: false, skipInstall: true })
    expect(result.ok).toBe(true)
    expect(readFileSync(join(root, 'vite.config.ts'), 'utf8')).toContain('reviewplane()')
    expect(readFileSync(join(root, 'src/main.tsx'), 'utf8')).toContain('<ReviewPlane')
    expect(readFileSync(join(root, '.agents/skills/reviewplane-create-react/SKILL.md'), 'utf8')).toContain('wait_for_review')
    expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).toContain('ReviewPlane')
    expect(existsSafe(join(root, 'src/vite-env.d.ts'))).toBe(true)

    const again = await initReviewPlane({ cwd: root, dryRun: false, skipInstall: true })
    expect(again.changes.every((change) => change.action === 'skip' || change.action === 'update')).toBe(true)
  })

  it('dry-run does not write files', async () => {
    const root = tempProject({
      'package.json': JSON.stringify({
        name: 'demo',
        dependencies: { react: '^19.0.0' },
        devDependencies: { vite: '^8.0.0' },
      }),
      'vite.config.ts': `import { defineConfig } from 'vite'\nexport default defineConfig({ plugins: [] })\n`,
      'src/main.tsx': `import { createRoot } from 'react-dom/client'\ncreateRoot(document.getElementById('root')!).render(<div />)\n`,
    })
    const result = await initReviewPlane({ cwd: root, dryRun: true, skipInstall: true })
    expect(result.dryRun).toBe(true)
    expect(existsSafe(join(root, 'AGENTS.md'))).toBe(false)
  })
})

describe('checkReviewPlane', () => {
  it('reports missing ReviewPlane packages', async () => {
    const root = tempProject({
      'package.json': JSON.stringify({
        name: 'demo',
        dependencies: { react: '^19.0.0' },
        devDependencies: { vite: '^8.0.0' },
      }),
      'vite.config.ts': 'export default {}\n',
    })
    const result = await checkReviewPlane(root)
    expect(result.findings.some((finding) => finding.id === 'vite-plugin' && finding.level !== 'ok')).toBe(true)
  })
})

function existsSafe(path: string) {
  try {
    readFileSync(path)
    return true
  } catch {
    return false
  }
}
