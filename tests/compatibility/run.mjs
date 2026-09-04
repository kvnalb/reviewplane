import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const packs = path.join(tmpdir(), 'reviewplane-compat-packs')
mkdirSync(packs, { recursive: true })
const environment = { ...process.env, npm_config_cache: path.join(tmpdir(), 'reviewplane-npm-cache') }

function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, env: environment, stdio: 'inherit' })
}

for (const workspace of ['@reviewplane/core', '@reviewplane/react', '@reviewplane/vite', 'reviewplane']) {
  run('npm', ['pack', '--workspace', workspace, '--pack-destination', packs])
}

const packageFile = (name) => `file:${path.join(packs, name)}`
const sdk = {
  '@reviewplane/core': packageFile('reviewplane-core-0.1.0.tgz'),
  '@reviewplane/react': packageFile('reviewplane-react-0.1.0.tgz'),
  '@reviewplane/vite': packageFile('reviewplane-vite-0.1.0.tgz'),
  reviewplane: packageFile('reviewplane-0.1.0.tgz'),
}

const fixtures = [
  {
    name: 'react18-css-modules',
    react: '18.3.1',
    plugin: "import react from '@vitejs/plugin-react'",
    pluginPackage: { '@vitejs/plugin-react': '^6.1.0' },
    extraDependencies: {},
    extraPlugins: '',
    app: "import styles from './Card.module.css'\nexport default function App(){ return <main><h1>React 18 review</h1><section className={styles.card}><p>CSS Modules stay mapped.</p></section></main> }\n",
    extras: { 'src/Card.module.css': '.card { padding: 2rem; border: 1px solid #888; }\n' },
  },
  {
    name: 'react19-swc-tailwind',
    react: '19.2.0',
    plugin: "import react from '@vitejs/plugin-react-swc'\nimport tailwindcss from '@tailwindcss/vite'",
    pluginPackage: { '@vitejs/plugin-react-swc': '^4.3.3', '@tailwindcss/vite': '^4.3.3', tailwindcss: '^4.3.3' },
    extraDependencies: {},
    extraPlugins: 'tailwindcss(), ',
    app: "export default function App(){ return <main className=\"mx-auto max-w-xl p-8\"><h1 className=\"text-4xl font-bold\">React 19 + SWC</h1><p className=\"mt-4 text-slate-600\">Tailwind classes stay mapped.</p></main> }\n",
    extras: { 'src/index.css': "@import 'tailwindcss';\n" },
  },
  {
    name: 'react19-radix-composition',
    react: '19.2.0',
    plugin: "import react from '@vitejs/plugin-react'",
    pluginPackage: { '@vitejs/plugin-react': '^6.1.0' },
    extraDependencies: { '@radix-ui/react-slot': '^1.3.3' },
    extraPlugins: '',
    app: "import { Slot } from '@radix-ui/react-slot'\nfunction Button({ asChild = false, children }: { asChild?: boolean; children: React.ReactNode }) { const Comp = asChild ? Slot : 'button'; return <Comp className=\"button\">{children}</Comp> }\nexport default function App(){ return <main><h1>Radix composition</h1><Button asChild><a href=\"#review\">Review this shadcn-style control</a></Button><section id=\"review\"><p>Local intrinsic elements stay selectable.</p></section></main> }\n",
    extras: {},
  },
]

function write(target, relative, content) {
  const file = path.join(target, relative)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, content)
}

function productionText(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name)
    return entry.isDirectory() ? productionText(target) : /\.(js|html)$/.test(entry.name) ? [readFileSync(target, 'utf8')] : []
  }).join('\n')
}

for (const fixture of fixtures) {
  const target = mkdtempSync(path.join(tmpdir(), `reviewplane-${fixture.name}-`))
  const packageJson = {
    name: fixture.name,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'tsc -b && vite build' },
    dependencies: { react: fixture.react, 'react-dom': fixture.react, ...fixture.extraDependencies },
    devDependencies: {
      ...sdk,
      ...fixture.pluginPackage,
      '@types/react': fixture.react.startsWith('18') ? '^18.3.28' : '^19.2.18',
      '@types/react-dom': fixture.react.startsWith('18') ? '^18.3.7' : '^19.2.4',
      typescript: '^6.0.2',
      vite: '^8.2.2',
    },
  }
  write(target, 'package.json', `${JSON.stringify(packageJson, null, 2)}\n`)
  write(target, 'index.html', '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n')
  write(target, 'tsconfig.json', `${JSON.stringify({ compilerOptions: { target: 'ES2023', lib: ['ES2023', 'DOM'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, noEmit: true, skipLibCheck: true, types: ['vite/client'] }, include: ['src', 'vite.config.ts'] }, null, 2)}\n`)
  write(target, 'vite.config.ts', `${fixture.plugin}\nimport { defineConfig } from 'vite'\nexport default defineConfig({ plugins: [${fixture.extraPlugins}react()] })\n`)
  write(target, 'src/main.tsx', "import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\ncreateRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)\n")
  write(target, 'src/App.tsx', fixture.app)
  write(target, 'src/index.css', fixture.extras['src/index.css'] ?? 'body { font-family: system-ui; margin: 0; } main { padding: 3rem; } .button { display: inline-flex; padding: .75rem 1rem; }\n')
  for (const [file, content] of Object.entries(fixture.extras)) write(target, file, content)
  run('npm', ['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], target)
  run('npx', ['reviewplane', 'init'], target)
  run('npm', ['run', 'build'], target)
  run('npx', ['reviewplane', 'check', '--json'], target)
  if (/data-rp-source-id|reviewplane-preview-styles|wait_for_review/.test(productionText(path.join(target, 'dist')))) {
    throw new Error(`${fixture.name} leaked ReviewPlane into production`)
  }
  console.log(`PASS ${fixture.name} ${target}`)
}
